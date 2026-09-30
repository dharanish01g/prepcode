//! Runs a student's program with prepcode's own runtimes, streaming output to
//! the console and forwarding what they type to the program's stdin.

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt};
use tokio::process::{ChildStdin, Command};
use tokio::sync::{watch, Mutex};

use crate::auth::CurrentUser;
use crate::files::resolve_file;
use crate::runtimes::{executable_path, zig_cache_dir};

/// Force-included when compiling C/C++. When stdout is a pipe (as it is here)
/// C fully buffers it, so a prompt like `printf("Enter a number: ")` wouldn't
/// show before `scanf` waits for input. Unbuffered output fixes that.
const C_PRELUDE: &str = "\
/* Added by prepcode so output appears immediately in the console. */
#include <stdio.h>
__attribute__((constructor)) static void prepcode_unbuffered_stdout(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
}
";

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum RunEvent {
    /// A line from prepcode itself, e.g. "Compiling hello.c…".
    Status { message: String },
    /// The student's program itself has started (after any compile step).
    Started,
    Output { stream: &'static str, text: String },
    /// The run is over. `stage` is "compile" if compilation failed.
    Exit { code: Option<i32>, stopped: bool, stage: &'static str },
}

struct ActiveRun {
    id: u64,
    stdin: Option<ChildStdin>,
    stop: watch::Sender<bool>,
}

/// The program currently running, if any. Only one runs at a time.
#[derive(Default)]
pub struct Runner(Mutex<Option<ActiveRun>>);

static NEXT_RUN_ID: AtomicU64 = AtomicU64::new(1);

fn language_name(extension: &str) -> &'static str {
    match extension {
        "py" => "Python",
        "js" => "JavaScript",
        "c" => "C",
        "cpp" => "C++",
        "java" => "Java",
        _ => "This language",
    }
}

#[tauri::command]
pub async fn run_program(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    runner: State<'_, Runner>,
    filename: String,
    on_event: Channel<RunEvent>,
) -> Result<(), String> {
    let reg_no = current.get()?;
    let source = resolve_file(&app, &current, &filename)?;
    if !source.is_file() {
        return Err(format!("{filename} doesn't exist."));
    }
    let extension = filename.rsplit_once('.').map(|(_, ext)| ext).unwrap_or_default();
    let exe = executable_path(&app, extension)?.ok_or_else(|| {
        format!(
            "{} isn't installed yet. Click New file, open Language, and download it.",
            language_name(extension)
        )
    })?;

    // Replace whatever was running before.
    let id = NEXT_RUN_ID.fetch_add(1, Ordering::Relaxed);
    let (stop_tx, stop_rx) = watch::channel(false);
    {
        let mut active = runner.0.lock().await;
        if let Some(previous) = active.take() {
            let _ = previous.stop.send(true);
        }
        *active = Some(ActiveRun { id, stdin: None, stop: stop_tx });
    }

    let ctx = RunContext { app: &app, runner: &runner, id, channel: &on_event, stop: stop_rx };
    let result = ctx.run(&reg_no, &source, &filename, extension, &exe).await;

    let mut active = runner.0.lock().await;
    if active.as_ref().is_some_and(|run| run.id == id) {
        *active = None;
    }
    result
}

/// Sends a line the student typed to the running program's stdin.
#[tauri::command]
pub async fn send_input(runner: State<'_, Runner>, text: String) -> Result<(), String> {
    let mut active = runner.0.lock().await;
    let stdin = active
        .as_mut()
        .and_then(|run| run.stdin.as_mut())
        .ok_or("The program isn't waiting for input.")?;
    stdin
        .write_all(text.as_bytes())
        .await
        .map_err(|_| "The program isn't reading input anymore.")?;
    stdin.flush().await.map_err(|_| "The program isn't reading input anymore.".into())
}

#[tauri::command]
pub async fn stop_program(runner: State<'_, Runner>) -> Result<(), String> {
    if let Some(run) = runner.0.lock().await.as_ref() {
        let _ = run.stop.send(true);
    }
    Ok(())
}

struct RunContext<'a> {
    app: &'a AppHandle,
    runner: &'a Runner,
    id: u64,
    channel: &'a Channel<RunEvent>,
    stop: watch::Receiver<bool>,
}

struct Finished {
    code: Option<i32>,
    stopped: bool,
}

impl RunContext<'_> {
    fn send(&self, event: RunEvent) {
        let _ = self.channel.send(event);
    }

    fn status(&self, message: String) {
        self.send(RunEvent::Status { message });
    }

    async fn run(
        &self,
        reg_no: &str,
        source: &Path,
        filename: &str,
        extension: &str,
        exe: &Path,
    ) -> Result<(), String> {
        let workdir = source.parent().ok_or("Invalid file location.")?;

        let mut program = match extension {
            "py" => {
                let mut cmd = runtime_command(exe);
                // -u: unbuffered, so output and prompts appear immediately.
                cmd.arg("-u")
                    .arg(filename)
                    .env("PYTHONUTF8", "1")
                    .env("PYTHONIOENCODING", "utf-8")
                    // Don't litter the student's folder with __pycache__.
                    .env("PYTHONDONTWRITEBYTECODE", "1");
                cmd
            }
            "js" => {
                let mut cmd = runtime_command(exe);
                cmd.arg(filename);
                cmd
            }
            "java" => {
                // Java 11+ runs a single source file directly; no javac step.
                let mut cmd = runtime_command(exe);
                cmd.args(["-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8"])
                    .arg(filename);
                cmd
            }
            "c" | "cpp" => {
                self.status(format!("Compiling {filename}…"));
                let binary = match self.compile(reg_no, source, extension, exe).await? {
                    Ok(binary) => binary,
                    Err(finished) => {
                        self.send(RunEvent::Exit {
                            code: finished.code,
                            stopped: finished.stopped,
                            stage: "compile",
                        });
                        return Ok(());
                    }
                };
                Command::new(binary)
            }
            _ => return Err(format!("Can't run .{extension} files.")),
        };

        program.current_dir(workdir);
        let finished = self.execute(program, true).await?;
        self.send(RunEvent::Exit { code: finished.code, stopped: finished.stopped, stage: "run" });
        Ok(())
    }

    /// Compiles with Zig into prepcode's build folder. Ok(Err(..)) means the
    /// compiler ran but failed (errors were already streamed to the console).
    async fn compile(
        &self,
        reg_no: &str,
        source: &Path,
        extension: &str,
        zig: &Path,
    ) -> Result<Result<PathBuf, Finished>, String> {
        let data = self
            .app
            .path()
            .app_local_data_dir()
            .map_err(|e| format!("Could not locate app data folder: {e}"))?;
        let build_dir = data.join("build").join(reg_no);
        let zig_cache = zig_cache_dir(self.app)?;
        std::fs::create_dir_all(&build_dir).map_err(|e| format!("Could not create build folder: {e}"))?;

        let prelude = build_dir.join("prepcode_prelude.h");
        std::fs::write(&prelude, C_PRELUDE).map_err(|e| format!("Could not prepare build: {e}"))?;

        let stem = source.file_stem().and_then(|s| s.to_str()).unwrap_or("program");
        let binary = build_dir.join(format!("{stem}{}", std::env::consts::EXE_SUFFIX));
        // Never run a stale binary if this compile fails.
        let _ = std::fs::remove_file(&binary);

        let mut cmd = runtime_command(zig);
        cmd.arg(if extension == "cpp" { "c++" } else { "cc" })
            .arg("-include")
            .arg(&prelude)
            .arg("-o")
            .arg(&binary)
            .arg(source)
            .current_dir(&build_dir)
            // Same cache the installer warmed up, inside prepcode's folder.
            .env("ZIG_GLOBAL_CACHE_DIR", &zig_cache)
            .env("ZIG_LOCAL_CACHE_DIR", &zig_cache);

        let finished = self.execute(cmd, false).await?;
        if finished.stopped || finished.code != Some(0) || !binary.is_file() {
            return Ok(Err(finished));
        }
        Ok(Ok(binary))
    }

    /// Spawns `cmd`, streams its output, and waits for it to exit or be stopped.
    async fn execute(&self, mut cmd: Command, interactive: bool) -> Result<Finished, String> {
        cmd.stdin(if interactive { Stdio::piped() } else { Stdio::null() })
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        #[cfg(windows)]
        {
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        let mut child = cmd.spawn().map_err(|e| format!("Could not start the program: {e}"))?;

        if let Some(stdin) = child.stdin.take() {
            if let Some(run) = self.runner.0.lock().await.as_mut().filter(|run| run.id == self.id) {
                run.stdin = Some(stdin);
            }
        }
        if interactive {
            self.send(RunEvent::Started);
        }

        let stdout = child.stdout.take().map(|out| pump(out, "stdout", self.channel.clone()));
        let stderr = child.stderr.take().map(|err| pump(err, "stderr", self.channel.clone()));

        let mut stop = self.stop.clone();
        let (status, stopped) = tokio::select! {
            status = child.wait() => (status, false),
            _ = stop_requested(&mut stop) => {
                let _ = child.kill().await;
                (child.wait().await, true)
            }
        };

        // Let the pumps flush the last output before reporting the exit.
        for pump in [stdout, stderr].into_iter().flatten() {
            let _ = pump.await;
        }
        if let Some(run) = self.runner.0.lock().await.as_mut().filter(|run| run.id == self.id) {
            run.stdin = None;
        }

        let status = status.map_err(|e| format!("Lost track of the program: {e}"))?;
        Ok(Finished { code: status.code(), stopped })
    }
}

/// A command for a runtime executable, with its folder first on PATH for this
/// process only, so the runtime can find its own helper programs.
fn runtime_command(exe: &Path) -> Command {
    let mut cmd = Command::new(exe);
    if let Some(dir) = exe.parent() {
        let mut paths = vec![dir.to_path_buf()];
        paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()));
        if let Ok(path) = std::env::join_paths(paths) {
            cmd.env("PATH", path);
        }
    }
    cmd
}

async fn stop_requested(stop: &mut watch::Receiver<bool>) {
    while !*stop.borrow_and_update() {
        if stop.changed().await.is_err() {
            // Sender gone without stopping: never resolve.
            std::future::pending::<()>().await;
        }
    }
}

/// Forwards a pipe to the console in chunks (not lines), so prompts without a
/// trailing newline still appear. Multi-byte UTF-8 split across chunks is kept
/// until complete.
fn pump(
    mut pipe: impl AsyncRead + Unpin + Send + 'static,
    stream: &'static str,
    channel: Channel<RunEvent>,
) -> tauri::async_runtime::JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        let mut buf = [0u8; 8192];
        let mut pending: Vec<u8> = Vec::new();
        loop {
            let n = match pipe.read(&mut buf).await {
                Ok(0) | Err(_) => break,
                Ok(n) => n,
            };
            pending.extend_from_slice(&buf[..n]);
            let text = take_utf8(&mut pending);
            if !text.is_empty() {
                let _ = channel.send(RunEvent::Output { stream, text });
            }
        }
        if !pending.is_empty() {
            let text = String::from_utf8_lossy(&pending).into_owned();
            let _ = channel.send(RunEvent::Output { stream, text });
        }
    })
}

/// Takes the decodable prefix of `bytes`, leaving an incomplete trailing
/// character (at most 3 bytes) for the next chunk. Invalid bytes become U+FFFD.
fn take_utf8(bytes: &mut Vec<u8>) -> String {
    let keep = match std::str::from_utf8(bytes) {
        Ok(_) => 0,
        Err(e) if e.error_len().is_none() => bytes.len() - e.valid_up_to(),
        Err(_) => 0,
    };
    let rest = bytes.split_off(bytes.len() - keep);
    let text = String::from_utf8_lossy(bytes).into_owned();
    *bytes = rest;
    text
}

#[cfg(test)]
mod tests {
    use super::take_utf8;

    #[test]
    fn keeps_split_multibyte_char_for_next_chunk() {
        let mut bytes = "héllo ✓".as_bytes().to_vec();
        bytes.pop(); // cut the 3-byte check mark mid-character
        assert_eq!(take_utf8(&mut bytes), "héllo ");
        assert_eq!(bytes.len(), 2);
        bytes.push(0x93);
        assert_eq!(take_utf8(&mut bytes), "✓");
        assert!(bytes.is_empty());
    }
}
