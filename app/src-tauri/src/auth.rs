//! Who's using prepcode: a student signed in with their prepcode account, or a
//! guest.
//!
//! A student signs in with GitHub in their browser (see account.rs) and stays
//! signed in, across restarts, until they log out: the session's refresh token
//! is kept in the OS's secure store (Keychain, Credential Manager, Secret
//! Service) and the account details in the database. On shared college PCs,
//! logging out before leaving is the student's job.
//!
//! A guest gets an empty workspace that's deleted when they log out or close
//! the app.

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use rusqlite::OptionalExtension;
use serde::Serialize;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;
use tokio::net::TcpListener;

use crate::account::{self, Account, AccountError, Tokens};
use crate::catalog;
use crate::databases;
use crate::db::Db;
use crate::files;
use crate::sql;
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

/// The signed-in student's access token and when it expires (Unix seconds).
/// Only ever in memory: a restart refreshes the session instead.
#[derive(Default)]
pub struct AccessToken {
    token: Mutex<Option<(String, u64)>>,
    /// Held while refreshing: each refresh token works only once.
    refreshing: tokio::sync::Mutex<()>,
}

impl AccessToken {
    fn set(&self, token: Option<(String, u64)>) {
        *self.token.lock().unwrap_or_else(|e| e.into_inner()) = token;
    }

    fn get(&self) -> Option<(String, u64)> {
        self.token.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    fn take(&self) -> Option<(String, u64)> {
        self.token.lock().unwrap_or_else(|e| e.into_inner()).take()
    }
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs()
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
    fn student(account: &Account) -> Self {
        Session {
            id: student_id(account),
            login: account.github_login.clone(),
            avatar_url: account.avatar_url.clone(),
            guest: false,
        }
    }
}

/// Guests get a workspace named `guest-<random>`; students `gh-<number>`.
pub(crate) const GUEST_PREFIX: &str = "guest-";

/// Named after the GitHub account, as before accounts existed, so a student's
/// files and sync history on this computer carry over.
fn student_id(account: &Account) -> String {
    format!("gh-{}", account.github_id)
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
/// The session's refresh token.
const KEYRING_REFRESH_TOKEN: &str = "account-refresh-token";
/// The account details (JSON) in the meta table.
const ACCOUNT_KEY: &str = "account";
/// Sign-in before accounts: a GitHub token from the device flow, and the
/// GitHub user. Nothing reads them any more; logging out removes both.
const KEYRING_GITHUB_TOKEN: &str = "github-token";
const GITHUB_ACCOUNT_KEY: &str = "github_account";

/// Runs a keyring call for `key` off the async runtime: some stores block.
async fn keyring<T: Send + 'static>(
    key: &'static str,
    f: impl FnOnce(keyring::Entry) -> keyring::Result<T> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || keyring::Entry::new(KEYRING_SERVICE, key).and_then(f))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| format!("Could not use this computer's secure storage: {e}"))
}

async fn keyring_get(key: &'static str) -> Result<Option<String>, String> {
    keyring(key, |entry| match entry.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e),
    })
    .await
}

async fn keyring_delete(key: &'static str) -> Result<(), String> {
    keyring(key, |entry| match entry.delete_credential() {
        Err(keyring::Error::NoEntry) => Ok(()),
        result => result,
    })
    .await
}

fn read_meta(db: &Db, key: &str) -> Result<Option<String>, String> {
    db.with(|conn| {
        conn.query_row("SELECT value FROM meta WHERE key = ?1", [key], |r| r.get(0))
            .optional()
            .map_err(|e| format!("Could not read your account: {e}"))
    })
}

fn delete_meta(db: &Db, key: &str) -> Result<(), String> {
    db.with(|conn| {
        conn.execute("DELETE FROM meta WHERE key = ?1", [key])
            .map(|_| ())
            .map_err(|e| format!("Could not sign you out: {e}"))
    })
}

fn saved_account(db: &Db) -> Result<Option<Account>, String> {
    Ok(read_meta(db, ACCOUNT_KEY)?.and_then(|raw| serde_json::from_str(&raw).ok()))
}

fn save_account(db: &Db, account: &Account) -> Result<(), String> {
    let raw = serde_json::to_string(account).map_err(|e| e.to_string())?;
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

/// Keeps a new session: the refresh token in the secure store, the account in
/// the database, the access token in memory.
async fn save_session(db: &Db, access: &AccessToken, tokens: Tokens) -> Result<Account, String> {
    let refresh_token = tokens.refresh_token;
    keyring(KEYRING_REFRESH_TOKEN, move |entry| entry.set_password(&refresh_token)).await?;
    save_account(db, &tokens.account)?;
    access.set(Some((tokens.access_token, tokens.expires_at)));
    Ok(tokens.account)
}

/// Removes the saved sign-in from this computer, including one from before
/// accounts.
async fn forget_sign_in(db: &Db, access: &AccessToken) -> Result<(), String> {
    access.set(None);
    delete_meta(db, ACCOUNT_KEY)?;
    delete_meta(db, GITHUB_ACCOUNT_KEY)?;
    keyring_delete(KEYRING_REFRESH_TOKEN).await?;
    keyring_delete(KEYRING_GITHUB_TOKEN).await
}

/// A current access token for the signed-in student, refreshing the session if
/// it's about to expire.
pub async fn access_token(db: &Db, access: &AccessToken) -> Result<String, String> {
    let _refreshing = access.refreshing.lock().await;
    if let Some((token, expires_at)) = access.get() {
        if expires_at > now() + 60 {
            return Ok(token);
        }
    }
    let expired = || "Your sign-in has expired. Log out and sign in again.".to_owned();
    let saved = saved_account(db)?.ok_or_else(expired)?;
    let refresh_token = keyring_get(KEYRING_REFRESH_TOKEN).await?.ok_or_else(expired)?;
    match account::refresh(&refresh_token).await {
        Ok(tokens) if tokens.account.github_id == saved.github_id => {
            let token = tokens.access_token.clone();
            save_session(db, access, tokens).await?;
            Ok(token)
        }
        Ok(_) | Err(AccountError::Rejected(_)) => Err(expired()),
        Err(e) => Err(e.message()),
    }
}

/// On launch: reopens the signed-in student's workspace, if there is one.
/// Offline, the saved sign-in is trusted; online, one that was signed out
/// elsewhere is dropped.
#[tauri::command]
pub async fn restore_session(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
    access: State<'_, AccessToken>,
) -> Result<Option<Session>, String> {
    let refresh_token = match keyring_get(KEYRING_REFRESH_TOKEN).await {
        Ok(token) => token,
        // E.g. a locked keychain, or no secret service on Linux: show the
        // sign-in screen, but keep the saved sign-in for when it works again.
        Err(e) => {
            log::error!("Could not read the saved sign-in: {e}");
            return Ok(None);
        }
    };
    let (Some(mut account), Some(refresh_token)) = (saved_account(&db)?, refresh_token) else {
        // Nothing (complete) saved. A sign-in from before accounts isn't
        // restored: the student signs in again, and logging out removes it.
        delete_meta(&db, ACCOUNT_KEY)?;
        keyring_delete(KEYRING_REFRESH_TOKEN).await?;
        return Ok(None);
    };
    match account::refresh(&refresh_token).await {
        // The username or picture may have changed; the GitHub id never does.
        Ok(tokens) if tokens.account.github_id == account.github_id => {
            account = save_session(&db, &access, tokens).await?;
        }
        Ok(_) | Err(AccountError::Rejected(_)) => {
            log::info!("The saved sign-in no longer works; signed out");
            forget_sign_in(&db, &access).await?;
            return Ok(None);
        }
        Err(e) => log::warn!("Could not refresh the saved sign-in, so it's trusted: {e:?}"),
    }
    open_workspace(&app, &db, &current, &student_id(&account))?;
    Ok(Some(Session::student(&account)))
}

// --- Signing in with GitHub, in the browser ------------------------------------------

/// How long a sign-in waits for the browser before giving up.
const SIGN_IN_TIMEOUT: Duration = Duration::from_secs(10 * 60);

struct PendingSignIn {
    attempt: u64,
    verifier: String,
    /// Where the browser comes back to; taken by `finish_github_sign_in`.
    listener: Option<TcpListener>,
}

/// The sign-in in progress, if any. A new attempt or a cancel replaces it,
/// which stops the old attempt's wait.
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

/// The sign-in page, so the student can open it again if the browser didn't.
#[derive(Serialize)]
pub struct SignInLink {
    url: String,
}

/// Starts signing in: opens GitHub (through the account system) in the
/// browser.
#[tauri::command]
pub async fn start_github_sign_in(app: AppHandle, sign_in: State<'_, SignIn>) -> Result<SignInLink, String> {
    // The session is kept in the OS's secure store. Find out now if there
    // isn't one (e.g. Linux without a secret service), not after the student
    // has approved prepcode on GitHub.
    keyring_get(KEYRING_REFRESH_TOKEN).await?;
    let pkce = account::pkce()?;
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .await
        .map_err(|e| format!("Could not start signing in: {e}"))?;
    let port = listener.local_addr().map_err(|e| format!("Could not start signing in: {e}"))?.port();
    let url = account::authorize_url(port, &pkce.challenge);
    let attempt = sign_in.attempts.fetch_add(1, Ordering::Relaxed) + 1;
    *sign_in.lock() = Some(PendingSignIn { attempt, verifier: pkce.verifier, listener: Some(listener) });
    // The dialog's Open browser again button tries again if this fails.
    if let Err(e) = app.opener().open_url(&url, None::<&str>) {
        log::warn!("Could not open the browser: {e}");
    }
    Ok(SignInLink { url })
}

/// Waits for the browser to come back after the student approves on GitHub,
/// then signs them in and remembers it. Resolves to None if the sign-in was
/// cancelled.
#[tauri::command]
pub async fn finish_github_sign_in(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
    access: State<'_, AccessToken>,
    sign_in: State<'_, SignIn>,
) -> Result<Option<Session>, String> {
    let Some((attempt, verifier, listener)) =
        sign_in.lock().as_mut().and_then(|p| Some((p.attempt, p.verifier.clone(), p.listener.take()?)))
    else {
        return Err("Start signing in first.".into());
    };

    // Ends when the browser comes back, the sign-in is cancelled or replaced,
    // or it times out. The listener closes when this returns.
    let cancelled = async {
        while sign_in.is_current(attempt) {
            tokio::time::sleep(Duration::from_millis(300)).await;
        }
    };
    let code = tokio::select! {
        code = account::wait_for_code(&listener) => code?,
        () = cancelled => return Ok(None),
        () = tokio::time::sleep(SIGN_IN_TIMEOUT) => {
            *sign_in.lock() = None;
            return Err("Signing in took too long. Please try again.".into());
        }
    };
    drop(listener);
    if !sign_in.is_current(attempt) {
        return Ok(None);
    }
    *sign_in.lock() = None;

    let tokens = account::exchange_code(&code, &verifier).await.map_err(|e| e.message())?;
    let account = save_session(&db, &access, tokens).await?;
    open_workspace(&app, &db, &current, &student_id(&account))?;
    // The student is in the browser; bring prepcode back.
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(Some(Session::student(&account)))
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
/// on GitHub; unsynced ones stay for their next sign-in here), their session
/// is ended and their saved sign-in removed. A guest's files are deleted.
#[tauri::command]
pub async fn logout(
    app: AppHandle,
    db: State<'_, Db>,
    current: State<'_, CurrentUser>,
    access: State<'_, AccessToken>,
    repo_tokens: State<'_, sync::RepoTokens>,
    servers: State<'_, sql::Servers>,
) -> Result<(), String> {
    let Ok(id) = current.get() else { return Ok(()) };
    current.set(None);
    repo_tokens.clear();
    servers.stop().await;
    if id.starts_with(GUEST_PREFIX) {
        delete_guest_files(&app);
        return Ok(());
    }
    if let Err(e) = sync::remove_synced_files(&app, &db, &id) {
        log::error!("Could not remove synced files: {e}");
    }
    // Best effort: offline, the session just expires on the server instead.
    if let Some((token, _)) = access.take() {
        if let Err(e) = account::sign_out(&token).await {
            log::warn!("Could not end the session on the server: {e:?}");
        }
    }
    forget_sign_in(&db, &access).await
}

/// Deletes every guest workspace, the programs compiled for it, and the
/// guest's databases. Runs when a guest logs out, when the app exits, and on
/// startup (for anything left by a crash or a forced quit). Best effort:
/// whatever can't be removed now (e.g. a program still running on Windows)
/// goes on the next startup.
pub fn delete_guest_files(app: &AppHandle) {
    let folders = [
        data_dir(app).map(|dir| dir.join("workspaces")),
        app.path().app_local_data_dir().map(|dir| dir.join("build")).map_err(|e| e.to_string()),
        databases::databases_dir(app),
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
