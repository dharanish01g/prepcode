use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

/// Serialises access to users.json so two commands can't clobber each other.
#[derive(Default)]
pub struct AuthLock(Mutex<()>);

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

#[derive(Serialize, Deserialize)]
struct User {
    reg_no: String,
    dob: String,
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

fn users_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("users.json"))
}

pub fn workspace_dir(app: &AppHandle, reg_no: &str) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("workspaces").join(reg_no))
}

fn load_users(app: &AppHandle) -> Result<Vec<User>, String> {
    let path = users_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Could not read accounts: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Accounts file is corrupted: {e}"))
}

fn save_users(app: &AppHandle, users: &[User]) -> Result<(), String> {
    let path = users_path(app)?;
    fs::create_dir_all(path.parent().unwrap())
        .map_err(|e| format!("Could not create app data folder: {e}"))?;
    let raw = serde_json::to_string_pretty(users).map_err(|e| e.to_string())?;
    // Write to a temp file then rename, so a crash never leaves a half-written file.
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, raw).map_err(|e| format!("Could not save accounts: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("Could not save accounts: {e}"))
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
    lock: State<AuthLock>,
    current: State<CurrentUser>,
    reg_no: String,
    dob: String,
) -> Result<Session, String> {
    let reg_no = normalize_reg_no(&reg_no)?;
    validate_dob(&dob)?;

    let _guard = lock.0.lock().map_err(|_| "Internal error, try again.")?;
    let mut users = load_users(&app)?;
    if users.iter().any(|u| u.reg_no == reg_no) {
        return Err(format!("{reg_no} is already registered. Please log in instead."));
    }

    fs::create_dir_all(workspace_dir(&app, &reg_no)?)
        .map_err(|e| format!("Could not create your workspace: {e}"))?;
    users.push(User { reg_no: reg_no.clone(), dob });
    save_users(&app, &users)?;

    current.set(Some(reg_no.clone()));
    Ok(Session { reg_no })
}

#[tauri::command]
pub fn login(
    app: AppHandle,
    lock: State<AuthLock>,
    current: State<CurrentUser>,
    reg_no: String,
    dob: String,
) -> Result<Session, String> {
    let reg_no = normalize_reg_no(&reg_no)?;
    validate_dob(&dob)?;

    let _guard = lock.0.lock().map_err(|_| "Internal error, try again.")?;
    let users = load_users(&app)?;
    let user = users
        .iter()
        .find(|u| u.reg_no == reg_no)
        .ok_or_else(|| format!("{reg_no} is not registered. Please register first."))?;
    if user.dob != dob {
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
