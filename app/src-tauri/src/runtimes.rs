//! Portable language runtimes that prepcode downloads for itself.
//!
//! Nothing is installed system-wide: each runtime is a portable archive,
//! checksum-verified, unpacked into `<shared data>/runtimes/<id>/` and run by
//! its full path. PATH, the registry and other programs are never touched.
//! Which runtimes exist, and how to use them, comes from the catalog.
//!
//! On Windows the shared data folder is machine-wide, so a lab PC downloads
//! each language once for every Windows account instead of once per account.

use std::collections::HashSet;
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;
#[cfg(windows)]
use std::sync::OnceLock;
use std::time::Duration;

use futures_util::StreamExt;
use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::AsyncWriteExt;

use crate::catalog::{self, ArchiveKind, Download, Runtime, Step, Vars};
use crate::db::Db;

/// Runtimes currently downloading, so the same one is never installed twice at once.
#[derive(Default)]
pub struct RuntimeInstalls(Mutex<HashSet<String>>);

/// Removes the runtime from RuntimeInstalls when the install ends, however it ends.
struct InstallGuard<'a> {
    installs: &'a RuntimeInstalls,
    id: String,
}

impl Drop for InstallGuard<'_> {
    fn drop(&mut self) {
        self.installs
            .0
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(&self.id);
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    extension: String,
    stage: &'static str,
    downloaded: u64,
    total: u64,
}

/// Where runtimes and the Zig cache live.
///
/// Windows: `C:\ProgramData\<identifier>`, shared by every Windows account on
/// the PC. Elsewhere: the user's local (not roaming) app data, since runtimes
/// are big and shouldn't sync between machines on networks that roam profiles.
#[cfg(windows)]
pub fn shared_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = std::env::var_os("ProgramData").ok_or("Could not locate the ProgramData folder.")?;
    let dir = PathBuf::from(base).join(&app.config().identifier);
    static SHARED: OnceLock<()> = OnceLock::new();
    SHARED.get_or_init(|| share_with_all_users(&dir));
    Ok(dir)
}

#[cfg(not(windows))]
pub fn shared_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map_err(|e| format!("Could not locate app data folder: {e}"))
}

/// By default, what one account creates in ProgramData is read-only to the
/// others: enough to run a runtime, but not to repair an interrupted download
/// or let Zig write its cache. So the account that creates the folder (its
/// owner, who may change its permissions without admin rights) grants all
/// users Modify, inherited by everything inside. Best effort: for every later
/// account this fails harmlessly because the permission is already there.
#[cfg(windows)]
fn share_with_all_users(dir: &Path) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    if fs::create_dir_all(dir).is_err() {
        return;
    }
    let icacls = std::env::var_os("SystemRoot")
        .map(|root| PathBuf::from(root).join("System32").join("icacls.exe"))
        .unwrap_or_else(|| PathBuf::from("icacls.exe"));
    // *S-1-5-32-545 is the built-in Users group, named by SID so it works in
    // every Windows language. (OI)(CI)M: Modify, inherited by files and folders.
    let _ = Command::new(icacls)
        .arg(dir)
        .args(["/grant", "*S-1-5-32-545:(OI)(CI)M", "/Q"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .status();
}

fn runtimes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(shared_data_dir(app)?.join("runtimes"))
}

/// Full path of the runtime's executable, if it's installed.
pub fn executable_path(app: &AppHandle, runtime: &Runtime) -> Result<Option<PathBuf>, String> {
    let path = runtimes_dir(app)?.join(&runtime.id).join(runtime.executable());
    Ok(path.is_file().then_some(path))
}

/// Extensions whose runtime is installed on this computer.
#[tauri::command]
pub fn list_runtimes(app: AppHandle, db: State<Db>) -> Result<Vec<String>, String> {
    let languages = db.with(|conn| catalog::languages(conn))?;
    let dir = runtimes_dir(&app)?;
    let mut installed = Vec::new();
    for language in languages {
        let runtime = db.with(|conn| catalog::runtime(conn, &language.runtime))?;
        if dir.join(&runtime.id).join(runtime.executable()).is_file() {
            installed.push(language.extension);
        }
    }
    Ok(installed)
}

/// A command for one step: the step's program (or the runtime's executable),
/// with placeholders filled in and the runtime's and step's environment set.
/// The runtime's folder goes first on PATH, for this process only, so the
/// runtime can find its own helper programs.
pub fn step_command(step: &Step, runtime: &Runtime, runtime_exe: &Path, vars: &Vars) -> Command {
    let program = match &step.program {
        Some(program) => PathBuf::from(vars.expand(program)),
        None => runtime_exe.to_path_buf(),
    };
    let mut cmd = Command::new(program);
    cmd.args(step.args.iter().map(|arg| vars.expand(arg)));
    if let Some(dir) = runtime_exe.parent() {
        let mut paths = vec![dir.to_path_buf()];
        paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()));
        if let Ok(path) = std::env::join_paths(paths) {
            cmd.env("PATH", path);
        }
    }
    for (key, value) in runtime.env.iter().chain(&step.env) {
        cmd.env(key, vars.expand(value));
    }
    cmd
}

/// Writes a step's `files` into `dir`. The catalog only allows plain file names.
pub fn write_step_files(step: &Step, dir: &Path) -> Result<(), String> {
    for (name, contents) in &step.files {
        fs::write(dir.join(name), contents).map_err(|e| format!("Could not prepare {name}: {e}"))?;
    }
    Ok(())
}

/// Downloads, verifies and unpacks the runtime for `extension`.
#[tauri::command]
pub async fn install_runtime(
    app: AppHandle,
    db: State<'_, Db>,
    installs: State<'_, RuntimeInstalls>,
    extension: String,
) -> Result<(), String> {
    let runtime = db.with(|conn| {
        let language = catalog::language(conn, &extension)?
            .ok_or_else(|| format!("Unsupported language: .{extension}"))?;
        catalog::runtime(conn, &language.runtime)
    })?;
    if executable_path(&app, &runtime)?.is_some() {
        return Ok(());
    }
    let download = runtime
        .download()
        .ok_or("This language isn't available for this computer yet.")?;

    if !installs.0.lock().unwrap_or_else(|e| e.into_inner()).insert(runtime.id.clone()) {
        return Err("Already downloading.".into());
    }
    let _guard = InstallGuard { installs: &installs, id: runtime.id.clone() };

    let root = runtimes_dir(&app)?;
    let work = root.join(".downloads");
    let archive = work.join(format!("{}.download", runtime.id));
    let staging = work.join(format!("{}.unpack", runtime.id));
    let warmup = work.join(format!("{}.warmup", runtime.id));
    let target = root.join(&runtime.id);

    // Leftovers from an interrupted attempt.
    let _ = fs::remove_file(&archive);
    let _ = fs::remove_dir_all(&staging);
    fs::create_dir_all(&work).map_err(|e| format!("Could not create runtimes folder: {e}"))?;

    let result = async {
        let emit = |stage, downloaded, total| {
            let _ = app.emit(
                "runtime-progress",
                Progress { extension: extension.clone(), stage, downloaded, total },
            );
        };

        download_verified(download, &archive, &emit).await?;

        emit("unpacking", 0, 0);
        let (archive_path, staging_path, kind) = (archive.clone(), staging.clone(), download.kind);
        let unpacked_root = tauri::async_runtime::spawn_blocking(move || {
            unpack(&archive_path, &staging_path, kind)?;
            single_top_level_dir(&staging_path)
        })
        .await
        .map_err(|e| format!("Unpacking failed: {e}"))??;

        emit("verifying", 0, 0);
        let exe = unpacked_root.join(runtime.executable());
        let version_args = runtime.version_args.clone();
        tauri::async_runtime::spawn_blocking(move || check_runs(&exe, &version_args))
            .await
            .map_err(|e| format!("Verification failed: {e}"))??;

        // The only step that makes the runtime visible: a single rename.
        let _ = fs::remove_dir_all(&target);
        fs::rename(&unpacked_root, &target)
            .map_err(|e| format!("Could not finish installing: {e}"))?;

        // E.g. Zig builds its C/C++ standard libraries on first use, which is
        // slow. Do it now, at the final path so caches match, while the UI
        // still shows "Checking…".
        if !runtime.warmup.is_empty() {
            let (runtime, exe, shared, scratch) = (
                runtime.clone(),
                target.join(runtime.executable()),
                shared_data_dir(&app)?,
                warmup.clone(),
            );
            let _ = tauri::async_runtime::spawn_blocking(move || {
                run_warmup(&runtime, &exe, &shared, &scratch)
            })
            .await;
        }
        Ok::<(), String>(())
    }
    .await;

    let _ = fs::remove_file(&archive);
    let _ = fs::remove_dir_all(&staging);
    let _ = fs::remove_dir_all(&warmup);
    result
}

/// Streams the download to `dest`, hashing as it goes, and rejects it if the
/// SHA-256 doesn't match the pinned checksum.
async fn download_verified(
    download: &Download,
    dest: &Path,
    emit: &impl Fn(&'static str, u64, u64),
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .read_timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Could not start download: {e}"))?;

    let response = client
        .get(&download.url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("Download failed. Check your internet connection. ({e})"))?;

    let total = response.content_length().unwrap_or(0);
    let mut file = tokio::fs::File::create(dest)
        .await
        .map_err(|e| format!("Could not save download: {e}"))?;
    let mut hasher = Sha256::new();
    let mut downloaded = 0u64;
    let mut last_percent = u64::MAX;
    let mut stream = response.bytes_stream();

    emit("downloading", 0, total);
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download interrupted: {e}"))?;
        hasher.update(&chunk);
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Could not save download: {e}"))?;
        downloaded += chunk.len() as u64;

        // Throttle events to whole-percent changes.
        let percent = if total > 0 { downloaded * 100 / total } else { 0 };
        if percent != last_percent {
            last_percent = percent;
            emit("downloading", downloaded, total);
        }
    }
    file.flush().await.map_err(|e| format!("Could not save download: {e}"))?;

    let actual = hex::encode(hasher.finalize());
    if actual != download.sha256 {
        return Err("The download was corrupted or tampered with. Please try again.".into());
    }
    Ok(())
}

fn unpack(archive: &Path, dest: &Path, kind: ArchiveKind) -> Result<(), String> {
    fs::create_dir_all(dest).map_err(|e| format!("Could not unpack: {e}"))?;
    let file = BufReader::new(File::open(archive).map_err(|e| format!("Could not unpack: {e}"))?);
    // Both extractors reject entries that would escape `dest` (e.g. "../").
    match kind {
        ArchiveKind::Zip => zip::ZipArchive::new(file)
            .and_then(|mut zip| zip.extract(dest))
            .map_err(|e| format!("Could not unpack: {e}")),
        ArchiveKind::TarGz => tar::Archive::new(flate2::read::GzDecoder::new(file))
            .unpack(dest)
            .map_err(|e| format!("Could not unpack: {e}")),
        ArchiveKind::TarXz => tar::Archive::new(xz2::read::XzDecoder::new(file))
            .unpack(dest)
            .map_err(|e| format!("Could not unpack: {e}")),
    }
}

/// Archives wrap everything in one folder (e.g. `node-v22.23.3-win-x64/`); return it.
fn single_top_level_dir(dir: &Path) -> Result<PathBuf, String> {
    let mut entries = fs::read_dir(dir)
        .map_err(|e| format!("Could not read unpacked files: {e}"))?
        .filter_map(|entry| entry.ok());
    match (entries.next(), entries.next()) {
        (Some(only), None) if only.path().is_dir() => Ok(only.path()),
        _ => Ok(dir.to_path_buf()),
    }
}

/// Runs the runtime's warmup steps in a scratch folder. Best effort: a failure
/// here only means the first real use is slower.
fn run_warmup(runtime: &Runtime, exe: &Path, shared: &Path, scratch: &Path) {
    let vars = Vars::default().set("shared", shared);
    for step in &runtime.warmup {
        if fs::create_dir_all(scratch).is_err() || write_step_files(step, scratch).is_err() {
            continue;
        }
        let mut command = step_command(step, runtime, exe, &vars);
        command
            .current_dir(scratch)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        }
        let _ = command.status();
    }
    let _ = fs::remove_dir_all(scratch);
}

/// Runs the executable's version command to prove the runtime actually works here.
fn check_runs(exe: &Path, args: &[String]) -> Result<(), String> {
    let mut command = Command::new(exe);
    command.args(args).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    match command.status() {
        Ok(status) if status.success() => Ok(()),
        Ok(status) => Err(format!("The downloaded language didn't start ({status}).")),
        Err(e) => Err(format!("The downloaded language didn't start: {e}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Real network install into a temp folder, using the same steps as
    /// install_runtime. Run with: cargo test -- --ignored
    fn install_for_this_platform(runtime_id: &str) {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id.starts_with(runtime_id)).unwrap();
        let download = runtime.download().expect("no build for this platform");
        let dir = std::env::temp_dir()
            .join(format!("prepcode-runtime-test-{}-{}", runtime.id, std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let archive = dir.join("download");
        let staging = dir.join("unpack");

        tauri::async_runtime::block_on(download_verified(download, &archive, &|_, _, _| {}))
            .expect("download or checksum failed");
        unpack(&archive, &staging, download.kind).expect("unpack failed");
        let root = single_top_level_dir(&staging).unwrap();
        check_runs(&root.join(runtime.executable()), &runtime.version_args).expect("didn't run");

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    #[ignore = "downloads ~20 MB"]
    fn installs_python() {
        install_for_this_platform("python-");
    }

    /// Covers the .tar.xz path (Zig is the only runtime shipped that way).
    #[test]
    #[ignore = "downloads ~50 MB"]
    fn installs_zig() {
        install_for_this_platform("zig-");
    }
}

