use std::fs::{self, OpenOptions};
use std::io::ErrorKind;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;

use serde::Serialize;
use tauri::{AppHandle, State};

use crate::auth::{workspace_dir, CurrentUser};

/// File types a student can create. Keep in sync with LANGUAGES in src/lib/files.ts.
const EXTENSIONS: &[&str] = &["py", "js", "c", "cpp", "java"];

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

/// Path of `<name>.<ext>` in the current student's workspace. Validating the
/// name also rules out path separators, so this can't escape the workspace.
pub(crate) fn resolve_file(app: &AppHandle, current: &CurrentUser, filename: &str) -> Result<PathBuf, String> {
    let (name, extension) = filename
        .rsplit_once('.')
        .ok_or_else(|| format!("Invalid file name: {filename}"))?;
    validate_name(name)?;
    if !EXTENSIONS.contains(&extension) {
        return Err(format!("Unsupported file type: .{extension}"));
    }
    Ok(workspace_dir(app, &current.get()?)?.join(filename))
}

#[tauri::command]
pub fn read_file(app: AppHandle, current: State<CurrentUser>, filename: String) -> Result<String, String> {
    let path = resolve_file(&app, &current, &filename)?;
    fs::read_to_string(&path).map_err(|e| format!("Could not open {filename}: {e}"))
}

#[tauri::command]
pub fn write_file(
    app: AppHandle,
    current: State<CurrentUser>,
    filename: String,
    content: String,
) -> Result<(), String> {
    let path = resolve_file(&app, &current, &filename)?;
    // Write to a hidden temp file then rename, so a crash mid-save never leaves
    // a half-written program. list_files skips it (".tmp" isn't a supported type).
    let tmp = path.with_file_name(format!(".{filename}.tmp"));
    fs::write(&tmp, content).map_err(|e| format!("Could not save {filename}: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("Could not save {filename}: {e}"))
}

/// Filenames in the student's workspace with a supported extension, sorted.
#[tauri::command]
pub fn list_files(app: AppHandle, current: State<CurrentUser>) -> Result<Vec<String>, String> {
    let dir = workspace_dir(&app, &current.get()?)?;
    let entries = match fs::read_dir(&dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(format!("Could not read your files: {e}")),
    };

    let mut files: Vec<String> = entries
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().map(|t| t.is_file()).unwrap_or(false))
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter(|name| {
            name.rsplit_once('.')
                .is_some_and(|(_, ext)| EXTENSIONS.contains(&ext))
        })
        .collect();
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
) -> Result<Vec<FileHistoryEntry>, String> {
    let dir = workspace_dir(&app, &current.get()?)?;
    let mut entries: Vec<FileHistoryEntry> = list_files(app, current)?
        .into_iter()
        .filter_map(|filename| {
            let modified = fs::metadata(dir.join(&filename)).and_then(|m| m.modified()).ok()?;
            let modified = modified.duration_since(UNIX_EPOCH).ok()?.as_millis() as u64;
            Some(FileHistoryEntry { filename, modified })
        })
        .collect();
    entries.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(entries)
}

/// Creates an empty `<name>.<extension>` and returns the filename.
#[tauri::command]
pub fn create_file(
    app: AppHandle,
    current: State<CurrentUser>,
    name: String,
    extension: String,
) -> Result<String, String> {
    let name = name.trim();
    validate_name(name)?;
    if !EXTENSIONS.contains(&extension.as_str()) {
        return Err("Select a language.".into());
    }

    let dir = workspace_dir(&app, &current.get()?)?;
    fs::create_dir_all(&dir).map_err(|e| format!("Could not open your workspace: {e}"))?;

    let filename = format!("{name}.{extension}");
    // Case-insensitive, so Hello.py and hello.py can't both exist on any OS.
    let taken = list_files(app.clone(), current)?
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
    filename: String,
    new_name: String,
) -> Result<String, String> {
    let old_path = resolve_file(&app, &current, &filename)?;
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
    let taken = list_files(app.clone(), current.clone())?
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
pub fn delete_file(app: AppHandle, current: State<CurrentUser>, filename: String) -> Result<(), String> {
    let path = resolve_file(&app, &current, &filename)?;
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        // Already gone is what the student wanted anyway.
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("Could not delete {filename}: {e}")),
    }
}
