//! Runs a student's program with prepcode's own runtimes, streaming output to
//! the console and forwarding what they type to the program's stdin. How to
//! compile and run each language comes from the catalog.

use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, watch, Mutex};

use crate::auth::CurrentUser;
use crate::catalog::{self, Language, Runtime, Vars};
use crate::db::Db;
use crate::files::{resolve_file, split_extension};
use crate::runtimes::{executable_path, shared_data_dir, step_command, write_step_files};

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum RunEvent {
    /// The student's program itself has started (after any compile step).
    Started,
    Output {
        stream: &'static str,
        text: String,
    },
    /// The run is over. `stage` is "compile" if compilation failed.
    Exit {
        code: Option<i32>,
        stopped: bool,
        stage: &'static str,
    },
}

struct ActiveRun {
    id: u64,
    /// Its own lock, so a write the program isn't reading never holds up Runner.
    stdin: Option<Arc<Mutex<ChildStdin>>>,
    stop: watch::Sender<bool>,
    /// Resolves once this run's `run_program` has returned and its process is gone.
    done: oneshot::Receiver<()>,
}

/// The program currently running, if any. Only one runs at a time.
#[derive(Default)]
pub struct Runner(Mutex<Option<ActiveRun>>);

static NEXT_RUN_ID: AtomicU64 = AtomicU64::new(1);

/// How long to wait for the last output once the program has exited.
const OUTPUT_GRACE: Duration = Duration::from_secs(2);

#[tauri::command]
pub async fn run_program(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    runner: State<'_, Runner>,
    filename: String,
    on_event: Channel<RunEvent>,
) -> Result<(), String> {
    let reg_no = current.get()?;
    let source = resolve_file(&app, &current, &db, &filename)?;
    if !source.is_file() {
        return Err(format!("{filename} doesn't exist."));
    }
    let extension = split_extension(&filename).map(|(_, ext)| ext).unwrap_or_default();
    let (language, runtime) = db.with(|conn| {
        let language = catalog::language(conn, extension)?
            .filter(|language| language.run.is_some())
            .ok_or_else(|| format!("Can't run .{extension} files."))?;
        let runtime = catalog::runtime(conn, &language.runtime)?;
        Ok((language, runtime))
    })?;
    let exe = executable_path(&app, &runtime)?.ok_or_else(|| {
        format!("{} isn't installed yet. Click New file, open Language, and download it.", language.name)
    })?;

    // Replace whatever was running before.
    let id = NEXT_RUN_ID.fetch_add(1, Ordering::Relaxed);
    let (stop_tx, stop_rx) = watch::channel(false);
    // Dropped when this function returns, which tells the next run we're gone.
    let (_done_tx, done_rx) = oneshot::channel::<()>();
    let previous = {
        let mut active = runner.0.lock().await;
        active.replace(ActiveRun { id, stdin: None, stop: stop_tx, done: done_rx })
    };
    // Wait for the old process to actually exit before starting. Otherwise a
    // quick re-run of the same compiled file can find the old binary still
    // locked (Windows) when compiling over it. Awaited outside the lock, since
    // the old run needs it to finish.
    if let Some(previous) = previous {
        let _ = previous.stop.send(true);
        let _ = previous.done.await;
    }

    let ctx = RunContext { app: &app, runner: &runner, id, channel: &on_event, stop: stop_rx };
    let result = ctx.run(&reg_no, &source, &filename, &language, &runtime, &exe).await;

    let mut active = runner.0.lock().await;
    if active.as_ref().is_some_and(|run| run.id == id) {
        *active = None;
    }
    result
}

/// Sends a line the student typed to the running program's stdin.
#[tauri::command]
pub async fn send_input(runner: State<'_, Runner>, text: String) -> Result<(), String> {
    // Runner isn't held while writing: the write waits for as long as the
    // program doesn't read, and Stop needs Runner meanwhile.
    let stdin = runner
        .0
        .lock()
        .await
        .as_ref()
        .and_then(|run| run.stdin.clone())
        .ok_or("The program isn't waiting for input.")?;
    let mut stdin = stdin.lock().await;
    stdin.write_all(text.as_bytes()).await.map_err(|_| "The program isn't reading input anymore.")?;
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

    /// Compiles (if the language has a compile step) and runs the program.
    /// Compiling happens in prepcode's build folder; the program itself runs in
    /// the student's workspace, so it can open files next to their code.
    async fn run(
        &self,
        reg_no: &str,
        source: &Path,
        filename: &str,
        language: &Language,
        runtime: &Runtime,
        exe: &Path,
    ) -> Result<(), String> {
        let run = language.run.as_ref().ok_or_else(|| format!("Can't run {filename}."))?;
        let workdir = source.parent().ok_or("Invalid file location.")?;
        let data = self
            .app
            .path()
            .app_local_data_dir()
            .map_err(|e| format!("Could not locate app data folder: {e}"))?;
        let build_dir = data.join("build").join(reg_no);
        std::fs::create_dir_all(&build_dir).map_err(|e| format!("Could not create build folder: {e}"))?;

        let stem = source.file_stem().and_then(|s| s.to_str()).unwrap_or("program");
        let binary = build_dir.join(format!("{stem}{}", std::env::consts::EXE_SUFFIX));
        let vars = Vars::default()
            .set("source", source)
            .set("filename", filename)
            .set("binary", &binary)
            .set("build", &build_dir)
            .set("shared", shared_data_dir(self.app)?);

        if let Some(compile) = &language.compile {
            // Never run a stale binary if this compile fails.
            let _ = std::fs::remove_file(&binary);
            write_step_files(compile, &build_dir)?;
            let mut cmd = Command::from(step_command(compile, runtime, exe, &vars));
            cmd.current_dir(&build_dir);
            let finished = self.execute(cmd, false).await?;
            if finished.stopped || finished.code != Some(0) || !binary.is_file() {
                self.send(RunEvent::Exit {
                    code: finished.code,
                    stopped: finished.stopped,
                    stage: "compile",
                });
                return Ok(());
            }
        }

        write_step_files(run, &build_dir)?;
        let mut program = Command::from(step_command(run, runtime, exe, &vars));
        program.current_dir(workdir);
        let finished = self.execute(program, true).await?;
        self.send(RunEvent::Exit { code: finished.code, stopped: finished.stopped, stage: "run" });
        Ok(())
    }

    /// Spawns `cmd`, streams its output, and waits for it to exit or be stopped.
    async fn execute(&self, mut cmd: Command, interactive: bool) -> Result<Finished, String> {
        cmd.stdin(if interactive { Stdio::piped() } else { Stdio::null() })
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        // Its own process group, so Stop also ends whatever it started.
        #[cfg(unix)]
        cmd.process_group(0);
        #[cfg(windows)]
        {
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        let mut child = cmd.spawn().map_err(|e| format!("Could not start the program: {e}"))?;
        // Kept: once the program has been waited on, child.id() is None.
        let pid = child.id();

        if let Some(stdin) = child.stdin.take() {
            if let Some(run) = self.runner.0.lock().await.as_mut().filter(|run| run.id == self.id) {
                run.stdin = Some(Arc::new(Mutex::new(stdin)));
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
                kill_tree(&mut child, pid).await;
                (child.wait().await, true)
            }
        };
        // Let the pumps flush the last output before reporting the exit, but
        // not forever: something the program left running in the background
        // (e.g. via fork() or system()) can hold the output open.
        let deadline = tokio::time::Instant::now() + OUTPUT_GRACE;
        for mut pump in [stdout, stderr].into_iter().flatten() {
            if tokio::time::timeout_at(deadline, &mut pump).await.is_err() {
                pump.abort();
            }
        }
        if let Some(run) = self.runner.0.lock().await.as_mut().filter(|run| run.id == self.id) {
            run.stdin = None;
        }

        let status = status.map_err(|e| format!("Lost track of the program: {e}"))?;
        Ok(Finished { code: status.code(), stopped })
    }
}

/// Kills the program and every process it started.
async fn kill_tree(child: &mut Child, pid: Option<u32>) {
    #[cfg(unix)]
    kill_group(pid);
    #[cfg(windows)]
    if let Some(pid) = pid {
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let taskkill = std::env::var_os("SystemRoot")
            .map(|root| Path::new(&root).join("System32").join("taskkill.exe"))
            .unwrap_or_else(|| "taskkill.exe".into());
        let _ = Command::new(taskkill)
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .await;
    }
    let _ = child.kill().await;
}

/// Kills the process group led by `pid` (see `execute`). Only call it before
/// the program has been waited on: until then its id, and so the group's,
/// can't be reused by another process.
#[cfg(unix)]
fn kill_group(pid: Option<u32>) {
    if let Some(pgid) = pid {
        // SAFETY: kill(2) takes no pointers; a negative pid names a process group.
        unsafe { libc::kill(-(pgid as libc::pid_t), libc::SIGKILL) };
    }
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
    // Skip past any invalid bytes to see whether the chunk ends mid-character.
    let mut rest: &[u8] = bytes;
    let keep = loop {
        match std::str::from_utf8(rest) {
            Ok(_) => break 0,
            Err(e) => match e.error_len() {
                None => break rest.len() - e.valid_up_to(),
                Some(invalid) => rest = &rest[e.valid_up_to() + invalid..],
            },
        }
    };
    let rest = bytes.split_off(bytes.len() - keep);
    let text = String::from_utf8_lossy(bytes).into_owned();
    *bytes = rest;
    text
}

#[cfg(test)]
mod tests {
    use super::take_utf8;

    /// A program that started a background process: Stop must end both, or
    /// the background one keeps the output open and the run never finishes.
    #[cfg(unix)]
    #[test]
    fn stop_ends_processes_the_program_started() {
        use std::process::Stdio;
        use std::time::Duration;
        use tokio::io::AsyncReadExt;

        tauri::async_runtime::block_on(async {
            let mut cmd = tokio::process::Command::new("sh");
            cmd.args(["-c", "sleep 30 & echo started; while :; do :; done"])
                .stdout(Stdio::piped())
                .kill_on_drop(true)
                .process_group(0);
            let mut child = cmd.spawn().unwrap();
            let pid = child.id();
            let mut out = child.stdout.take().unwrap();
            let mut first = [0u8; 8];
            let _ = out.read(&mut first).await.unwrap();

            super::kill_tree(&mut child, pid).await;
            let mut rest = Vec::new();
            let eof = tokio::time::timeout(Duration::from_secs(5), out.read_to_end(&mut rest)).await;
            assert!(eof.is_ok(), "output still open: the background process survived Stop");
        });
    }

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

    #[test]
    fn keeps_split_char_after_invalid_byte() {
        let mut bytes = b"a\xFFb".to_vec();
        bytes.extend_from_slice(&"✓".as_bytes()[..2]);
        assert_eq!(take_utf8(&mut bytes), "a\u{FFFD}b");
        assert_eq!(bytes.len(), 2);
        bytes.push(0x93);
        assert_eq!(take_utf8(&mut bytes), "✓");
    }
}
