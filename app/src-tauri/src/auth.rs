//! Who's using prepcode: a student signed in with GitHub, or a guest.
//!
//! A student stays signed in, across restarts, until they log out: their
//! GitHub token is kept in the OS's secure store (Keychain, Credential
//! Manager, Secret Service) and their account details in the database. On
//! shared college PCs, logging out before leaving is the student's job.
//!
//! A guest gets an empty workspace that's deleted when they log out or close
//! the app.

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use rusqlite::OptionalExtension;
use serde::Serialize;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;

use crate::catalog;
use crate::db::Db;
use crate::files;
use crate::github::{self, DeviceCode, GitHubError, Poll, User};
use crate::sync;

/// The signed-in workspace: `gh-<GitHub user id>` for a student, or
/// `guest-<random>`. File commands read this instead of trusting a name sent
/// from the frontend.
#[derive(Default)]
pub struct CurrentUser(Mutex<Option<String>>);

impl CurrentUser {
    fn set(&self, id: Option<String>) {
        *self.0.lock().unwrap_or_else(|e| e.into_inner()) = id;
    }

    pub fn get(&self) -> Result<String, String> {
        self.0.lock().unwrap_or_else(|e| e.into_inner()).clone().ok_or_else(|| "You're not logged in.".into())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    /// The workspace id (see CurrentUser).
    id: String,
    /// GitHub username, or "Guest".
    login: String,
    avatar_url: Option<String>,
    /// A guest's files are deleted when they log out or close the app.
    guest: bool,
}

impl Session {
    fn student(user: &User) -> Self {
        Session {
            id: student_id(user),
            login: user.login.clone(),
            avatar_url: user.avatar_url.clone(),
            guest: false,
        }
    }
}

/// Guests get a workspace named `guest-<random>`; students `gh-<number>`.
pub(crate) const GUEST_PREFIX: &str = "guest-";

fn student_id(user: &User) -> String {
    format!("gh-{}", user.id)
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| format!("Could not locate app data folder: {e}"))
}

pub fn workspace_dir(app: &AppHandle, id: &str) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("workspaces").join(id))
}

fn open_workspace(app: &AppHandle, db: &Db, current: &CurrentUser, id: &str) -> Result<(), String> {
    let dir = workspace_dir(app, id)?;
    fs::create_dir_all(&dir).map_err(|e| format!("Could not open your workspace: {e}"))?;
    files::tidy_workspace(&dir, &db.with(|conn| catalog::extensions(conn))?);
    current.set(Some(id.to_owned()));
    Ok(())
}

// --- The saved sign-in -----------------------------------------------------------

const KEYRING_SERVICE: &str = "in.prepwisely.code";
const KEYRING_TOKEN: &str = "github-token";
const ACCOUNT_KEY: &str = "github_account";

/// Runs a keyring call off the async runtime: some stores block.
async fn keyring<T: Send + 'static>(
    f: impl FnOnce(keyring::Entry) -> keyring::Result<T> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        keyring::Entry::new(KEYRING_SERVICE, KEYRING_TOKEN).and_then(f)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| format!("Could not use this computer's secure storage: {e}"))
}

/// The saved GitHub token, if a student is signed in on this computer.
pub async fn saved_token() -> Result<Option<String>, String> {
    keyring(|entry| match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e),
    })
    .await
}

fn saved_account(db: &Db) -> Result<Option<User>, String> {
    let raw: Option<String> = db.with(|conn| {
        conn.query_row("SELECT value FROM meta WHERE key = ?1", [ACCOUNT_KEY], |r| r.get(0))
            .optional()
            .map_err(|e| format!("Could not read your account: {e}"))
    })?;
    Ok(raw.and_then(|raw| serde_json::from_str(&raw).ok()))
}

fn save_account(db: &Db, user: &User) -> Result<(), String> {
    let raw = serde_json::to_string(user).map_err(|e| e.to_string())?;
    db.with(|conn| {
        conn.execute(
            "INSERT INTO meta (key, value) VALUES (?1, ?2)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value",
            [ACCOUNT_KEY, &raw],
        )
        .map(|_| ())
        .map_err(|e| format!("Could not save your account: {e}"))
    })
}

/// Removes the saved sign-in from this computer.
async fn forget_sign_in(db: &Db) -> Result<(), String> {
    db.with(|conn| {
        conn.execute("DELETE FROM meta WHERE key = ?1", [ACCOUNT_KEY])
            .map(|_| ())
            .map_err(|e| format!("Could not sign you out: {e}"))
    })?;
    keyring(|entry| match entry.delete_credential() {
        Err(keyring::Error::NoEntry) => Ok(()),
        result => result,
    })
    .await
}

/// On launch: reopens the signed-in student's workspace, if there is one.
/// Offline, the saved sign-in is trusted; online, a revoked one is dropped.
#[tauri::command]
pub async fn restore_session(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
) -> Result<Option<Session>, String> {
    let token = match saved_token().await {
        Ok(token) => token,
        // E.g. a locked keychain, or no secret service on Linux: show the
        // sign-in screen, but keep the saved sign-in for when it works again.
        Err(e) => {
            eprintln!("{e}");
            return Ok(None);
        }
    };
    let (Some(mut user), Some(token)) = (saved_account(&db)?, token) else {
        forget_sign_in(&db).await?;
        return Ok(None);
    };
    match github::user(&token).await {
        // The username or picture may have changed; the id never does.
        Ok(fresh) if fresh.id == user.id => {
            user = fresh;
            save_account(&db, &user)?;
        }
        Ok(_) | Err(GitHubError::Unauthorized) => {
            forget_sign_in(&db).await?;
            return Ok(None);
        }
        Err(_) => {}
    }
    open_workspace(&app, &db, &current, &student_id(&user))?;
    Ok(Some(Session::student(&user)))
}

// --- Signing in with GitHub (device flow) ------------------------------------------

struct PendingSignIn {
    attempt: u64,
    code: DeviceCode,
}

/// The sign-in in progress, if any. A new attempt or a cancel replaces it,
/// which stops the old attempt's polling.
#[derive(Default)]
pub struct SignIn {
    pending: Mutex<Option<PendingSignIn>>,
    attempts: AtomicU64,
}

impl SignIn {
    fn lock(&self) -> std::sync::MutexGuard<'_, Option<PendingSignIn>> {
        self.pending.lock().unwrap_or_else(|e| e.into_inner())
    }

    fn is_current(&self, attempt: u64) -> bool {
        self.lock().as_ref().is_some_and(|p| p.attempt == attempt)
    }
}

/// Starts signing in: opens GitHub's code page in the browser and returns the
/// code the student enters there.
#[tauri::command]
pub async fn start_github_sign_in(app: AppHandle, sign_in: State<'_, SignIn>) -> Result<DeviceCode, String> {
    // The token is kept in the OS's secure store. Find out now if there isn't
    // one (e.g. Linux without a secret service), not after the student has
    // approved prepcode on GitHub.
    saved_token().await?;
    let code = github::request_device_code().await.map_err(|e| e.message())?;
    let attempt = sign_in.attempts.fetch_add(1, Ordering::Relaxed) + 1;
    *sign_in.lock() = Some(PendingSignIn { attempt, code: code.clone() });
    // The dialog's Open GitHub button tries again if this fails.
    if let Err(e) = app.opener().open_url(&code.verification_uri, None::<&str>) {
        eprintln!("Could not open the browser: {e}");
    }
    Ok(code)
}

/// Waits for the student to approve the code on GitHub, then signs them in
/// and remembers it. Resolves to None if the sign-in was cancelled.
#[tauri::command]
pub async fn finish_github_sign_in(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
    sign_in: State<'_, SignIn>,
) -> Result<Option<Session>, String> {
    let Some((attempt, code)) = sign_in.lock().as_ref().map(|p| (p.attempt, p.code.clone())) else {
        return Err("Start signing in first.".into());
    };
    let deadline = Instant::now() + Duration::from_secs(code.expires_in);
    let mut interval = Duration::from_secs(code.interval.max(1));

    let token = loop {
        tokio::time::sleep(interval).await;
        if !sign_in.is_current(attempt) {
            return Ok(None);
        }
        if Instant::now() > deadline {
            return Err("The code expired. Please try signing in again.".into());
        }
        match github::poll_for_token(&code.device_code).await {
            Ok(Poll::Approved(token)) => break token,
            Ok(Poll::Pending) | Err(GitHubError::Offline) => {}
            Ok(Poll::SlowDown) => interval += Duration::from_secs(5),
            Ok(Poll::Expired) => return Err("The code expired. Please try signing in again.".into()),
            Ok(Poll::Denied) => return Err("Sign-in was cancelled on GitHub.".into()),
            Err(e) => return Err(e.message()),
        }
    };
    if !sign_in.is_current(attempt) {
        return Ok(None);
    }
    *sign_in.lock() = None;

    let user = github::user(&token).await.map_err(|e| e.message())?;
    keyring(move |entry| entry.set_password(&token)).await?;
    save_account(&db, &user)?;
    open_workspace(&app, &db, &current, &student_id(&user))?;
    Ok(Some(Session::student(&user)))
}

#[tauri::command]
pub fn cancel_github_sign_in(sign_in: State<SignIn>) {
    *sign_in.lock() = None;
}

// --- Guests --------------------------------------------------------------------------

/// Starts a guest session in a fresh, empty workspace. Nothing is kept:
/// see `delete_guest_files`.
#[tauri::command]
pub fn guest_login(app: AppHandle, current: State<CurrentUser>) -> Result<Session, String> {
    delete_guest_files(&app);
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    let id = format!("{GUEST_PREFIX}{nanos:x}");
    fs::create_dir_all(workspace_dir(&app, &id)?)
        .map_err(|e| format!("Could not create a guest workspace: {e}"))?;

    current.set(Some(id.clone()));
    Ok(Session { id, login: "Guest".into(), avatar_url: None, guest: true })
}

/// Signs out. A student's synced files are deleted from this computer (they're
/// on GitHub; unsynced ones stay for their next sign-in here) and their saved
/// sign-in is removed. A guest's files are deleted.
#[tauri::command]
pub async fn logout(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
) -> Result<(), String> {
    let Ok(id) = current.get() else { return Ok(()) };
    current.set(None);
    if id.starts_with(GUEST_PREFIX) {
        delete_guest_files(&app);
        return Ok(());
    }
    if let Err(e) = sync::remove_synced_files(&app, &db, &id) {
        eprintln!("Could not remove synced files: {e}");
    }
    forget_sign_in(&db).await
}

/// Deletes every guest workspace and the programs compiled for it. Runs when
/// a guest logs out, when the app exits, and on startup (for anything left by
/// a crash or a forced quit). Best effort: whatever can't be removed now (e.g.
/// a program still running on Windows) goes on the next startup.
pub fn delete_guest_files(app: &AppHandle) {
    let folders = [
        data_dir(app).map(|dir| dir.join("workspaces")),
        app.path().app_local_data_dir().map(|dir| dir.join("build")).map_err(|e| e.to_string()),
    ];
    for folder in folders.into_iter().flatten() {
        let Ok(entries) = fs::read_dir(&folder) else { continue };
        for entry in entries.flatten() {
            if entry.file_name().to_string_lossy().starts_with(GUEST_PREFIX) {
                let _ = fs::remove_dir_all(entry.path());
            }
        }
    }
}
