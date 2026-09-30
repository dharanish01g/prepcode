use std::fs::{self, OpenOptions};
use std::io::ErrorKind;
use std::path::PathBuf;

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
        return Err("Pick a file type.".into());
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
