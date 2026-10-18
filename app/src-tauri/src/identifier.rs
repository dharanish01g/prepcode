//! Moving data saved under the app's old identifier, `in.prepwisely.code`.
//!
//! Every folder the app keeps is named after its identifier, so changing it
//! would leave students without their files, databases, installed languages
//! and logs. On launch, before anything opens them, each old folder is renamed
//! to the new name. The saved sign-in moves separately (`auth`), since it's in
//! the OS's secure storage, not a folder.

use std::path::PathBuf;

use tauri::{AppHandle, Manager};

pub const OLD: &str = "in.prepwisely.code";

/// Renames each old folder that hasn't moved yet. Returns what happened, to log
/// once logging has started (its folder is one of these).
pub fn move_old_folders(app: &AppHandle) -> Vec<(log::Level, String)> {
    let new_name = &app.config().identifier;
    let path = app.path();
    let mut dirs: Vec<PathBuf> =
        [path.app_data_dir(), path.app_local_data_dir(), path.app_log_dir()].into_iter().flatten().collect();
    #[cfg(windows)]
    if let Some(base) = std::env::var_os("ProgramData") {
        dirs.push(PathBuf::from(base).join(new_name));
    }
    // Some are the same folder (e.g. both data folders on macOS), and on
    // Windows the logs folder is inside the local one, so it moves with it.
    dirs.sort();
    dirs.dedup();
    dirs.retain(|dir| dir.file_name().is_some_and(|name| name == new_name.as_str()));

    let mut report = Vec::new();
    for new in dirs {
        let old = new.with_file_name(OLD);
        if !old.exists() {
            continue;
        }
        if new.exists() {
            report.push((
                log::Level::Warn,
                format!("Not moving {}: {} already exists.", old.display(), new.display()),
            ));
            continue;
        }
        // Same parent, so a rename: instant, whatever the size. It fails if
        // something inside is in use, e.g. another Windows account running a
        // language from ProgramData; that's then downloaded again.
        match std::fs::rename(&old, &new) {
            Ok(()) => {
                report.push((log::Level::Info, format!("Moved {} to {}.", old.display(), new.display())))
            }
            Err(e) => report.push((
                log::Level::Warn,
                format!("Could not move {} to {}: {e}", old.display(), new.display()),
            )),
        }
    }
    report
}
