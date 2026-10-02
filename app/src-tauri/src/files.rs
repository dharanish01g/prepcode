//! A workspace's files. Each lives in a folder named after the day it was
//! created, e.g. `02oct2026/code2.py`, which is also its path in the student's
//! GitHub repo. File names are unique across all the folders, so the app
//! refers to a file by its name alone.

use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::auth::{workspace_dir, CurrentUser, GUEST_PREFIX};
use crate::catalog;
use crate::db::Db;

/// Letters, digits, `_` and `-`, not starting with `-`. The extension is added separately.
fn validate_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Enter a file name.".into());
    }
    if name.len() > 64 {
        return Err("File name is too long (max 64 characters).".into());
    }
    if name.starts_with('-')
        || !name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
    {
        return Err("Use only letters, numbers, _ and -.".into());
    }
    Ok(())
}

const MONTHS: [&str; 12] =
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/// A creation-date folder name: `ddmmmyyyy`, e.g. `02oct2026`.
pub(crate) fn is_date_folder(name: &str) -> bool {
    name.len() == 9
        && name[..2].chars().all(|c| c.is_ascii_digit())
        && MONTHS.contains(&&name[2..5])
        && name[5..].chars().all(|c| c.is_ascii_digit())
}

/// The date folder for a moment, in UTC. Only used to tidy files from before
/// date folders; new files get the student's local date from the frontend.
fn date_folder_for(time: SystemTime) -> String {
    let days = time.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() / 86_400;
    // Howard Hinnant's days-to-civil algorithm.
    let z = days as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!("{day:02}{}{year}", MONTHS[(month - 1) as usize])
}

/// A file in a workspace.
pub(crate) struct WorkspaceFile {
    /// e.g. `code2.py`
    pub filename: String,
    /// e.g. `02oct2026/code2.py`, also its path in the GitHub repo.
    pub relative: String,
    pub path: PathBuf,
}

/// Every file with a supported extension in `dir`'s date folders.
pub(crate) fn workspace_files(dir: &Path, extensions: &HashSet<String>) -> Result<Vec<WorkspaceFile>, String> {
    let folders = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(format!("Could not read your files: {e}")),
    };
    let mut files = Vec::new();
    for folder in folders.flatten() {
        let Ok(folder_name) = folder.file_name().into_string() else { continue };
        if !is_date_folder(&folder_name) || !folder.path().is_dir() {
            continue;
        }
        let Ok(entries) = fs::read_dir(folder.path()) else { continue };
        for entry in entries.flatten() {
            let Ok(filename) = entry.file_name().into_string() else { continue };
            let supported = filename.rsplit_once('.').is_some_and(|(_, ext)| extensions.contains(ext));
            if supported && entry.path().is_file() {
                files.push(WorkspaceFile {
                    relative: format!("{folder_name}/{filename}"),
                    path: entry.path(),
                    filename,
                });
            }
        }
    }
    Ok(files)
}

/// Moves files sitting directly in the workspace (from before date folders)
/// into the folder for the day they were last changed.
pub(crate) fn tidy_workspace(dir: &Path) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let Ok(filename) = entry.file_name().into_string() else { continue };
        if filename.starts_with('.') || !filename.contains('.') || !entry.path().is_file() {
            continue;
        }
        let changed = entry.metadata().and_then(|m| m.modified()).unwrap_or(SystemTime::now());
        let folder = dir.join(date_folder_for(changed));
        if fs::create_dir_all(&folder).is_ok() && !folder.join(&filename).exists() {
            let _ = fs::rename(entry.path(), folder.join(&filename));
        }
    }
}

fn current_files(app: &AppHandle, current: &CurrentUser, db: &Db) -> Result<Vec<WorkspaceFile>, String> {
    let extensions = db.with(|conn| catalog::extensions(conn))?;
    workspace_files(&workspace_dir(app, &current.get()?)?, &extensions)
}

/// Path of the current student's file `<name>.<ext>`, in whichever date
/// folder it's in. Validating the name (and the catalog validating
/// extensions) rules out path separators.
pub(crate) fn resolve_file(
    app: &AppHandle,
    current: &CurrentUser,
    db: &Db,
    filename: &str,
) -> Result<PathBuf, String> {
    let (name, extension) = filename
        .rsplit_once('.')
        .ok_or_else(|| format!("Invalid file name: {filename}"))?;
    validate_name(name)?;
    if !db.with(|conn| catalog::is_supported(conn, extension))? {
        return Err(format!("Unsupported file type: .{extension}"));
    }
    current_files(app, current, db)?
        .into_iter()
        .find(|file| file.filename == filename)
        .map(|file| file.path)
        .ok_or_else(|| format!("{filename} doesn't exist anymore."))
}

#[tauri::command]
pub fn read_file(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    filename: String,
) -> Result<String, String> {
    let path = resolve_file(&app, &current, &db, &filename)?;
    fs::read_to_string(&path).map_err(|e| format!("Could not open {filename}: {e}"))
}

#[tauri::command]
pub fn write_file(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    filename: String,
    content: String,
) -> Result<(), String> {
    let path = resolve_file(&app, &current, &db, &filename)?;
    // Write to a hidden temp file then rename, so a crash mid-save never leaves
    // a half-written program. list_files skips it (".tmp" isn't a supported type).
    let tmp = path.with_file_name(format!(".{filename}.tmp"));
    fs::write(&tmp, content).map_err(|e| format!("Could not save {filename}: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("Could not save {filename}: {e}"))
}

/// Filenames in the student's workspace with a supported extension, sorted.
#[tauri::command]
pub fn list_files(app: AppHandle, current: State<CurrentUser>, db: State<Db>) -> Result<Vec<String>, String> {
    let mut files: Vec<String> =
        current_files(&app, &current, &db)?.into_iter().map(|file| file.filename).collect();
    files.sort_by_key(|name| name.to_lowercase());
    Ok(files)
}

#[derive(Serialize)]
pub struct FileHistoryEntry {
    filename: String,
    /// Last modified, in milliseconds since the Unix epoch (what JS Date takes).
    modified: u64,
}

/// The student's files with when each was last edited, newest first.
#[tauri::command]
pub fn list_file_history(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
) -> Result<Vec<FileHistoryEntry>, String> {
    let mut entries: Vec<FileHistoryEntry> = current_files(&app, &current, &db)?
        .into_iter()
        .filter_map(|file| {
            let modified = fs::metadata(&file.path).and_then(|m| m.modified()).ok()?;
            let modified = modified.duration_since(UNIX_EPOCH).ok()?.as_millis() as u64;
            Some(FileHistoryEntry { filename: file.filename, modified })
        })
        .collect();
    entries.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(entries)
}

/// Creates an empty `<name>.<extension>` in the date folder `folder` (today,
/// in the student's local time, e.g. `02oct2026`) and returns the filename.
#[tauri::command]
pub fn create_file(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    name: String,
    extension: String,
    folder: String,
) -> Result<String, String> {
    let name = name.trim();
    validate_name(name)?;
    if !db.with(|conn| catalog::is_supported(conn, &extension))? {
        return Err("Select a language.".into());
    }
    if !is_date_folder(&folder) {
        return Err(format!("Invalid folder: {folder}"));
    }

    let dir = workspace_dir(&app, &current.get()?)?.join(&folder);
    fs::create_dir_all(&dir).map_err(|e| format!("Could not open your workspace: {e}"))?;

    let filename = format!("{name}.{extension}");
    // Across every date folder, and case-insensitive, so Hello.py and
    // hello.py can't both exist on any OS.
    let taken = list_files(app.clone(), current, db)?
        .iter()
        .any(|f| f.eq_ignore_ascii_case(&filename));
    if taken {
        return Err(format!("{filename} already exists."));
    }

    // create_new fails instead of overwriting if the file appeared meanwhile.
    match OpenOptions::new().write(true).create_new(true).open(dir.join(&filename)) {
        Ok(_) => Ok(filename),
        Err(e) if e.kind() == ErrorKind::AlreadyExists => Err(format!("{filename} already exists.")),
        Err(e) => Err(format!("Could not create {filename}: {e}")),
    }
}

/// Renames `filename` to `<new_name>.<same extension>` and returns the new
/// filename. The language can't change, so the extension is kept.
#[tauri::command]
pub fn rename_file(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    filename: String,
    new_name: String,
) -> Result<String, String> {
    let old_path = resolve_file(&app, &current, &db, &filename)?;
    let new_name = new_name.trim();
    validate_name(new_name)?;
    let extension = filename.rsplit_once('.').map(|(_, ext)| ext).unwrap_or_default();
    let new_filename = format!("{new_name}.{extension}");
    if new_filename == filename {
        return Ok(new_filename);
    }
    if !old_path.is_file() {
        return Err(format!("{filename} doesn't exist anymore."));
    }

    // Case-insensitive, like create_file. A case-only change (hello.py ->
    // Hello.py) is allowed: it's the same file.
    let taken = list_files(app.clone(), current.clone(), db.clone())?
        .iter()
        .any(|f| f.eq_ignore_ascii_case(&new_filename) && !f.eq_ignore_ascii_case(&filename));
    if taken {
        return Err(format!("{new_filename} already exists."));
    }

    fs::rename(&old_path, old_path.with_file_name(&new_filename))
        .map_err(|e| format!("Could not rename {filename}: {e}"))?;
    Ok(new_filename)
}

/// Permanently deletes `filename` from the student's workspace.
#[tauri::command]
pub fn delete_file(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    filename: String,
) -> Result<(), String> {
    let path = match resolve_file(&app, &current, &db, &filename) {
        Ok(path) => path,
        // Already gone is what the student wanted anyway.
        Err(_) if !filename.is_empty() => return Ok(()),
        Err(e) => return Err(e),
    };
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        // Already gone is what the student wanted anyway.
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("Could not delete {filename}: {e}")),
    }
}

/// Zips a guest's files into their Downloads folder as
/// `prepcode_guest_<stamp>.zip` (`(2)`, `(3)`… if that name is taken) and
/// returns the zip's full path. `stamp` is the local date and time from the
/// frontend, e.g. `2026-10-02_14-30-05`.
#[tauri::command]
pub fn export_guest_files(
    app: AppHandle,
    current: State<CurrentUser>,
    db: State<Db>,
    stamp: String,
) -> Result<String, String> {
    let id = current.get()?;
    if !id.starts_with(GUEST_PREFIX) {
        return Err("Only guest files can be exported.".into());
    }
    if stamp.is_empty() || !stamp.chars().all(|c| c.is_ascii_digit() || c == '-' || c == '_') {
        return Err("Invalid export time.".into());
    }
    let files = current_files(&app, &current, &db)?;
    if files.is_empty() {
        return Err("There are no files to export.".into());
    }

    let downloads = app
        .path()
        .download_dir()
        .map_err(|e| format!("Could not find your Downloads folder: {e}"))?;
    fs::create_dir_all(&downloads).map_err(|e| format!("Could not open your Downloads folder: {e}"))?;
    let zip_path = (1..)
        .map(|n| match n {
            1 => downloads.join(format!("prepcode_guest_{stamp}.zip")),
            n => downloads.join(format!("prepcode_guest_{stamp} ({n}).zip")),
        })
        .find(|path| !path.exists())
        .expect("some name is free");

    let err = |e: &dyn std::fmt::Display| format!("Could not export your files: {e}");
    let result = (|| {
        let mut zip = zip::ZipWriter::new(File::create_new(&zip_path).map_err(|e| err(&e))?);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);
        // Keep the date folders, like the GitHub repo.
        for file in &files {
            let contents = fs::read(&file.path).map_err(|e| err(&e))?;
            zip.start_file(file.relative.as_str(), options).map_err(|e| err(&e))?;
            zip.write_all(&contents).map_err(|e| err(&e))?;
        }
        zip.finish().map_err(|e| err(&e))?;
        Ok::<(), String>(())
    })();
    if let Err(e) = result {
        // Don't leave a broken zip behind.
        let _ = fs::remove_file(&zip_path);
        return Err(e);
    }
    Ok(zip_path.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn date_folders() {
        assert!(is_date_folder("02oct2026"));
        assert!(is_date_folder("27feb2025"));
        assert!(!is_date_folder("02Oct2026"));
        assert!(!is_date_folder("2oct2026"));
        assert!(!is_date_folder("02xyz2026"));
        assert!(!is_date_folder("../etc"));
        // 2026-10-02T12:00:00Z
        let time = UNIX_EPOCH + Duration::from_secs(1_790_899_200 + 43_200);
        assert_eq!(date_folder_for(time), "02oct2026");
        assert_eq!(date_folder_for(UNIX_EPOCH), "01jan1970");
        // 2024-02-29 (leap day)
        assert_eq!(date_folder_for(UNIX_EPOCH + Duration::from_secs(1_709_164_800)), "29feb2024");
    }
}
