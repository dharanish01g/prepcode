use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::db::Db;

/// The logged-in student. File commands read this instead of trusting a
/// register number sent from the frontend.
#[derive(Default)]
pub struct CurrentUser(Mutex<Option<String>>);

impl CurrentUser {
    fn set(&self, reg_no: Option<String>) {
        *self.0.lock().unwrap_or_else(|e| e.into_inner()) = reg_no;
    }

    pub fn get(&self) -> Result<String, String> {
        self.0
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .clone()
            .ok_or_else(|| "You're not logged in.".into())
    }
}

#[derive(Serialize)]
pub struct Session {
    reg_no: String,
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Could not locate app data folder: {e}"))
}

pub fn workspace_dir(app: &AppHandle, reg_no: &str) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("workspaces").join(reg_no))
}

/// Register numbers double as folder names, so only allow safe characters.
fn normalize_reg_no(reg_no: &str) -> Result<String, String> {
    let reg_no = reg_no.trim().to_uppercase();
    if reg_no.is_empty() {
        return Err("Enter your register number.".into());
    }
    if reg_no.len() > 32 || !reg_no.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err("Register number can only contain letters and digits.".into());
    }
    Ok(reg_no)
}

/// Expects YYYY-MM-DD, which is what the frontend sends.
fn validate_dob(dob: &str) -> Result<(), String> {
    let parts: Vec<&str> = dob.split('-').collect();
    let valid = parts.len() == 3
        && parts[0].len() == 4
        && parts[1].len() == 2
        && parts[2].len() == 2
        && parts.iter().all(|p| p.chars().all(|c| c.is_ascii_digit()));
    if valid {
        Ok(())
    } else {
        Err("Select your date of birth.".into())
    }
}

#[tauri::command]
pub fn register(
    app: AppHandle,
    db: State<Db>,
    current: State<CurrentUser>,
    reg_no: String,
    dob: String,
) -> Result<Session, String> {
    let reg_no = normalize_reg_no(&reg_no)?;
    validate_dob(&dob)?;

    db.with(|conn| {
        let inserted = conn
            .execute(
                "INSERT OR IGNORE INTO users (reg_no, dob) VALUES (?1, ?2)",
                params![reg_no, dob],
            )
            .map_err(|e| format!("Could not save your account: {e}"))?;
        if inserted == 0 {
            return Err(format!("{reg_no} is already registered. Please log in instead."));
        }
        Ok(())
    })?;

    fs::create_dir_all(workspace_dir(&app, &reg_no)?)
        .map_err(|e| format!("Could not create your workspace: {e}"))?;

    current.set(Some(reg_no.clone()));
    Ok(Session { reg_no })
}

#[tauri::command]
pub fn login(
    app: AppHandle,
    db: State<Db>,
    current: State<CurrentUser>,
    reg_no: String,
    dob: String,
) -> Result<Session, String> {
    let reg_no = normalize_reg_no(&reg_no)?;
    validate_dob(&dob)?;

    let saved_dob: String = db
        .with(|conn| {
            conn.query_row("SELECT dob FROM users WHERE reg_no = ?1", [&reg_no], |row| row.get(0))
                .optional()
                .map_err(|e| format!("Could not read accounts: {e}"))
        })?
        .ok_or_else(|| format!("{reg_no} is not registered. Please register first."))?;
    if saved_dob != dob {
        return Err("Date of birth doesn't match. Try again.".into());
    }

    // Recreate the workspace if it was deleted by hand.
    fs::create_dir_all(workspace_dir(&app, &reg_no)?)
        .map_err(|e| format!("Could not open your workspace: {e}"))?;

    current.set(Some(reg_no.clone()));
    Ok(Session { reg_no })
}

#[tauri::command]
pub fn logout(current: State<CurrentUser>) {
    current.set(None);
}
