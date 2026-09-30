//! Portable language runtimes that prepcode downloads for itself.
//!
//! Nothing is installed system-wide: each runtime is a portable archive,
//! checksum-verified, unpacked into `<shared data>/runtimes/<id>/` and run by
//! its full path. PATH, the registry and other programs are never touched.
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

#[derive(Clone, Copy)]
enum ArchiveKind {
    Zip,
    TarGz,
    TarXz,
}

struct Download {
    url: &'static str,
    sha256: &'static str,
    kind: ArchiveKind,
}

struct Runtime {
    /// Folder name under runtimes/; includes the version so upgrades never collide.
    id: &'static str,
    /// Main executable, relative to the runtime folder, per OS.
    exe_windows: &'static str,
    exe_macos: &'static str,
    exe_linux: &'static str,
    /// Arguments that make the executable print its version (used to verify the install).
    version_args: &'static [&'static str],
    /// Downloads per (OS, arch) as reported by std::env::consts.
    downloads: &'static [(&'static str, &'static str, Download)],
}

impl Runtime {
    fn executable(&self) -> &'static str {
        match std::env::consts::OS {
            "windows" => self.exe_windows,
            "macos" => self.exe_macos,
            _ => self.exe_linux,
        }
    }

    fn download(&self) -> Option<&'static Download> {
        let (os, arch) = (std::env::consts::OS, std::env::consts::ARCH);
        self.downloads
            .iter()
            .find(|(o, a, _)| *o == os && *a == arch)
            .map(|(_, _, d)| d)
    }
}

// Pinned versions with official SHA-256 checksums, so every lab machine gets
// exactly the same, verified files. Update these deliberately, never "latest".

const PYTHON: Runtime = Runtime {
    id: "python-3.13.15",
    exe_windows: "python.exe",
    exe_macos: "bin/python3",
    exe_linux: "bin/python3",
    version_args: &["--version"],
    downloads: &[
        ("windows", "x86_64", Download {
            url: "https://github.com/astral-sh/python-build-standalone/releases/download/20260929/cpython-3.13.15%2B20260929-x86_64-pc-windows-msvc-install_only.tar.gz",
            sha256: "26877c51b0aa91066f9d76291c324c6037b2ad8c40a1f85f51801b6c9ff0789c",
            kind: ArchiveKind::TarGz,
        }),
        ("macos", "aarch64", Download {
            url: "https://github.com/astral-sh/python-build-standalone/releases/download/20260929/cpython-3.13.15%2B20260929-aarch64-apple-darwin-install_only.tar.gz",
            sha256: "003d459a75ff6949a6590812b1e02a65e849b5b2a9f47c421010138ec643a11c",
            kind: ArchiveKind::TarGz,
        }),
        ("macos", "x86_64", Download {
            url: "https://github.com/astral-sh/python-build-standalone/releases/download/20260929/cpython-3.13.15%2B20260929-x86_64-apple-darwin-install_only.tar.gz",
            sha256: "54e9da9571fd13655096dbfbd2f18a04ff90fe0051c135cb6547d6e76c3db507",
            kind: ArchiveKind::TarGz,
        }),
        ("linux", "x86_64", Download {
            url: "https://github.com/astral-sh/python-build-standalone/releases/download/20260929/cpython-3.13.15%2B20260929-x86_64-unknown-linux-gnu-install_only.tar.gz",
            sha256: "d6b4e09474dfc219befabeae16264466f09615a991dcd080ae698833bdb3ed44",
            kind: ArchiveKind::TarGz,
        }),
    ],
};

const NODE: Runtime = Runtime {
    id: "node-22.23.3",
    exe_windows: "node.exe",
    exe_macos: "bin/node",
    exe_linux: "bin/node",
    version_args: &["--version"],
    downloads: &[
        ("windows", "x86_64", Download {
            url: "https://nodejs.org/dist/v22.23.3/node-v22.23.3-win-x64.zip",
            sha256: "2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71",
            kind: ArchiveKind::Zip,
        }),
        ("macos", "aarch64", Download {
            url: "https://nodejs.org/dist/v22.23.3/node-v22.23.3-darwin-arm64.tar.gz",
            sha256: "23b25245dcfb9af7262f8ff142e9e2e0af025368117329e7a7458a51e5922f53",
            kind: ArchiveKind::TarGz,
        }),
        ("macos", "x86_64", Download {
            url: "https://nodejs.org/dist/v22.23.3/node-v22.23.3-darwin-x64.tar.gz",
            sha256: "8a677b0219178efd6eb0e475457c4afb452b521a92f6e67845a73bd85727f2a8",
            kind: ArchiveKind::TarGz,
        }),
        ("linux", "x86_64", Download {
            url: "https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-x64.tar.gz",
            sha256: "1084aa36196bba4c3a5e69a1ee388a6e4ff729dad09445fbcd434b28fe3c24af",
            kind: ArchiveKind::TarGz,
        }),
    ],
};

const JAVA: Runtime = Runtime {
    id: "jdk-21.0.12.1",
    exe_windows: "bin/java.exe",
    exe_macos: "Contents/Home/bin/java",
    exe_linux: "bin/java",
    version_args: &["-version"],
    downloads: &[
        ("windows", "x86_64", Download {
            url: "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip",
            sha256: "f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e",
            kind: ArchiveKind::Zip,
        }),
        ("macos", "aarch64", Download {
            url: "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_aarch64_mac_hotspot_21.0.12.1_1.tar.gz",
            sha256: "3623232f33a9c3baadf304480b2535f9a3cba8a58d42ecbb438ba267315d9998",
            kind: ArchiveKind::TarGz,
        }),
        ("macos", "x86_64", Download {
            url: "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_mac_hotspot_21.0.12.1_1.tar.gz",
            sha256: "44db0f08196daf19a47f90d13388b0c943b67663cb537f998fe29e836fa842ce",
            kind: ArchiveKind::TarGz,
        }),
        ("linux", "x86_64", Download {
            url: "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz",
            sha256: "ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94",
            kind: ArchiveKind::TarGz,
        }),
    ],
};

/// Zig bundles a complete C and C++ toolchain (`zig cc` / `zig c++`).
const ZIG: Runtime = Runtime {
    id: "zig-0.16.0",
    exe_windows: "zig.exe",
    exe_macos: "zig",
    exe_linux: "zig",
    version_args: &["version"],
    downloads: &[
        ("windows", "x86_64", Download {
            url: "https://ziglang.org/download/0.16.0/zig-x86_64-windows-0.16.0.zip",
            sha256: "68659eb5f1e4eb1437a722f1dd889c5a322c9954607f5edcf337bc3684a75a7e",
            kind: ArchiveKind::Zip,
        }),
        ("macos", "aarch64", Download {
            url: "https://ziglang.org/download/0.16.0/zig-aarch64-macos-0.16.0.tar.xz",
            sha256: "b23d70deaa879b5c2d486ed3316f7eaa53e84acf6fc9cc747de152450d401489",
            kind: ArchiveKind::TarXz,
        }),
        ("macos", "x86_64", Download {
            url: "https://ziglang.org/download/0.16.0/zig-x86_64-macos-0.16.0.tar.xz",
            sha256: "0387557ed1877bc6a2e1802c8391953baddba76081876301c522f52977b52ba7",
            kind: ArchiveKind::TarXz,
        }),
        ("linux", "x86_64", Download {
            url: "https://ziglang.org/download/0.16.0/zig-x86_64-linux-0.16.0.tar.xz",
            sha256: "70e49664a74374b48b51e6f3fdfbf437f6395d42509050588bd49abe52ba3d00",
            kind: ArchiveKind::TarXz,
        }),
    ],
};

/// File extension -> runtime that runs it. C and C++ share Zig.
const LANGUAGE_RUNTIMES: &[(&str, &Runtime)] = &[
    ("py", &PYTHON),
    ("js", &NODE),
    ("c", &ZIG),
    ("cpp", &ZIG),
    ("java", &JAVA),
];

fn runtime_for(extension: &str) -> Result<&'static Runtime, String> {
    LANGUAGE_RUNTIMES
        .iter()
        .find(|(ext, _)| *ext == extension)
        .map(|(_, runtime)| *runtime)
        .ok_or_else(|| format!("Unsupported language: .{extension}"))
}

/// Runtimes currently downloading, so the same one is never installed twice at once.
#[derive(Default)]
pub struct RuntimeInstalls(Mutex<HashSet<&'static str>>);

/// Removes the runtime from RuntimeInstalls when the install ends, however it ends.
struct InstallGuard<'a> {
    installs: &'a RuntimeInstalls,
    id: &'static str,
}

impl Drop for InstallGuard<'_> {
    fn drop(&mut self) {
        self.installs
            .0
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(self.id);
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
fn shared_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = std::env::var_os("ProgramData").ok_or("Could not locate the ProgramData folder.")?;
    let dir = PathBuf::from(base).join(&app.config().identifier);
    static SHARED: OnceLock<()> = OnceLock::new();
    SHARED.get_or_init(|| share_with_all_users(&dir));
    Ok(dir)
}

#[cfg(not(windows))]
fn shared_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
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

fn is_installed(app: &AppHandle, runtime: &Runtime) -> Result<bool, String> {
    Ok(runtimes_dir(app)?.join(runtime.id).join(runtime.executable()).is_file())
}

/// Full path of the executable that runs `extension`, if its runtime is installed.
pub fn executable_path(app: &AppHandle, extension: &str) -> Result<Option<PathBuf>, String> {
    let runtime = runtime_for(extension)?;
    let path = runtimes_dir(app)?.join(runtime.id).join(runtime.executable());
    Ok(path.is_file().then_some(path))
}

/// Extensions whose runtime is installed on this computer.
#[tauri::command]
pub fn list_runtimes(app: AppHandle) -> Result<Vec<String>, String> {
    let mut installed = Vec::new();
    for (extension, runtime) in LANGUAGE_RUNTIMES {
        if is_installed(&app, runtime)? {
            installed.push(extension.to_string());
        }
    }
    Ok(installed)
}

/// Downloads, verifies and unpacks the runtime for `extension`.
#[tauri::command]
pub async fn install_runtime(
    app: AppHandle,
    installs: State<'_, RuntimeInstalls>,
    extension: String,
) -> Result<(), String> {
    let runtime = runtime_for(&extension)?;
    if is_installed(&app, runtime)? {
        return Ok(());
    }
    let download = runtime
        .download()
        .ok_or("This language isn't available for this computer yet.")?;

    if !installs.0.lock().unwrap_or_else(|e| e.into_inner()).insert(runtime.id) {
        return Err("Already downloading.".into());
    }
    let _guard = InstallGuard { installs: &installs, id: runtime.id };

    let root = runtimes_dir(&app)?;
    let work = root.join(".downloads");
    let archive = work.join(format!("{}.download", runtime.id));
    let staging = work.join(format!("{}.unpack", runtime.id));
    let target = root.join(runtime.id);

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
        let version_args = runtime.version_args;
        tauri::async_runtime::spawn_blocking(move || check_runs(&exe, version_args))
            .await
            .map_err(|e| format!("Verification failed: {e}"))??;

        // Zig builds its C/C++ standard libraries on first use, which is slow and
        // prints thousands of warnings on macOS. Do it now, at its final path so
        // the cache matches, while the UI still shows "Checking…".
        let warm_up_zig = runtime.id == ZIG.id;

        // The only step that makes the runtime visible: a single rename.
        let _ = fs::remove_dir_all(&target);
        fs::rename(&unpacked_root, &target)
            .map_err(|e| format!("Could not finish installing: {e}"))?;

        if warm_up_zig {
            let (zig, cache, scratch) =
                (target.join(runtime.executable()), zig_cache_dir(&app)?, work.clone());
            let _ = tauri::async_runtime::spawn_blocking(move || warm_up_zig_cache(&zig, &cache, &scratch))
                .await;
        }
        Ok::<(), String>(())
    }
    .await;

    let _ = fs::remove_file(&archive);
    let _ = fs::remove_dir_all(&staging);
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
        .get(download.url)
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

/// Zig's cache, kept inside prepcode's folder instead of the user's home. It
/// sits next to the runtimes so the standard libraries the installer builds
/// are reused by every account, not rebuilt on each one's first compile.
pub fn zig_cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(shared_data_dir(app)?.join("zig-cache"))
}

/// Compiles throwaway C and C++ programs so Zig builds and caches its standard
/// libraries now. Best effort: a failure here only means the first real compile is slower.
fn warm_up_zig_cache(zig: &Path, cache: &Path, scratch: &Path) {
    let _ = fs::create_dir_all(scratch);
    for (mode, file, code) in [
        ("cc", "warmup.c", "#include <stdio.h>\nint main(void){puts(\"ok\");return 0;}\n"),
        ("c++", "warmup.cpp", "#include <iostream>\n#include <string>\nint main(){std::string s;std::cout<<s;}\n"),
    ] {
        let source = scratch.join(file);
        let output = scratch.join(format!("warmup-{}{}", file.replace('.', "-"), std::env::consts::EXE_SUFFIX));
        if fs::write(&source, code).is_err() {
            continue;
        }
        let mut command = Command::new(zig);
        command
            .args([mode, "-o"])
            .arg(&output)
            .arg(&source)
            .env("ZIG_GLOBAL_CACHE_DIR", cache)
            .env("ZIG_LOCAL_CACHE_DIR", cache)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        }
        let _ = command.status();
        let _ = fs::remove_file(&source);
        let _ = fs::remove_file(&output);
    }
}

/// Runs the executable's version command to prove the runtime actually works here.
fn check_runs(exe: &Path, args: &[&str]) -> Result<(), String> {
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
    fn install_for_this_platform(runtime: &Runtime) {
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
        check_runs(&root.join(runtime.executable()), runtime.version_args).expect("didn't run");

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    #[ignore = "downloads ~20 MB"]
    fn installs_python() {
        install_for_this_platform(&PYTHON);
    }

    /// Covers the .tar.xz path (Zig is the only runtime shipped that way).
    #[test]
    #[ignore = "downloads ~50 MB"]
    fn installs_zig() {
        install_for_this_platform(&ZIG);
    }
}
