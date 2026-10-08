//! Syncing a student's workspace with their public `prepcode-programs` GitHub repo.
//!
//! Nothing syncs on its own: the student clicks Sync, which pulls what changed
//! on GitHub (e.g. from another computer) and then pushes everything changed
//! here as one commit. Signing in pulls too, so a new computer gets the
//! student's files.
//!
//! For each file, `synced_files` records the git blob sha of the content it
//! had at the last sync. Comparing that with the file now (locally, and on
//! GitHub) tells what changed where, so nothing has to be tracked as the
//! student edits. When a file changed both here and on GitHub, both are kept:
//! GitHub's version takes the name, and the local one becomes
//! `<name>_conflict.<ext>`.

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use futures_util::StreamExt;
use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::json;
use sha1::{Digest, Sha1};
use tauri::{AppHandle, Manager, State};

use crate::account::{self, AccountError, RepoToken};
use crate::auth::{self, workspace_dir, AccessToken, CurrentUser, GitHubUserToken, GUEST_PREFIX};
use crate::catalog;
use crate::db::Db;
use crate::files::{self, split_extension, WorkspaceFile, WorkspaceLock};
use crate::github::{self, GitHubError};

/// Marks a repo as made by prepcode, so an unrelated repo that happens to be
/// called `prepcode` is never synced into.
const MARKER: &str = ".prepcode";
const MARKER_CONTENT: &str = "This repository holds programs saved from prepcode.\n";

/// The git blob sha of `bytes`: what GitHub calls the file's sha.
fn blob_sha(bytes: &[u8]) -> String {
    let mut hasher = Sha1::new();
    hasher.update(format!("blob {}\0", bytes.len()).as_bytes());
    hasher.update(bytes);
    hasher.finalize().iter().map(|b| format!("{b:02x}")).collect()
}

fn db_err(e: rusqlite::Error) -> String {
    format!("Could not read the sync state: {e}")
}

/// A file as it was at the last sync.
struct Synced {
    sha: String,
    /// None for files synced before contents were kept.
    content: Option<Vec<u8>>,
}

/// Path (e.g. `02oct2026/code2.py`) -> the file at the last sync.
fn synced(conn: &Connection, user: &str) -> Result<HashMap<String, Synced>, String> {
    let mut stmt =
        conn.prepare("SELECT path, sha, content FROM synced_files WHERE user_id = ?1").map_err(db_err)?;
    let rows = stmt
        .query_map([user], |r| Ok((r.get(0)?, Synced { sha: r.get(1)?, content: r.get(2)? })))
        .map_err(db_err)?;
    rows.collect::<rusqlite::Result<_>>().map_err(db_err)
}

/// Records a path's synced state: its sha and content, or None if it's gone.
fn set_synced(conn: &Connection, user: &str, path: &str, file: Option<(&str, &[u8])>) -> Result<(), String> {
    match file {
        Some((sha, content)) => conn.execute(
            "INSERT INTO synced_files (user_id, path, sha, content) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (user_id, path) DO UPDATE SET sha = excluded.sha, content = excluded.content",
            params![user, path, sha, content],
        ),
        None => {
            conn.execute("DELETE FROM synced_files WHERE user_id = ?1 AND path = ?2", params![user, path])
        }
    }
    .map(|_| ())
    .map_err(db_err)
}

/// A local file with its content now.
struct Local {
    file: WorkspaceFile,
    sha: String,
    bytes: Vec<u8>,
}

fn local_files(app: &AppHandle, db: &Db, user: &str) -> Result<HashMap<String, Local>, String> {
    let extensions = db.with(|conn| catalog::extensions(conn))?;
    let mut local = HashMap::new();
    for file in files::workspace_files(&workspace_dir(app, user)?, &extensions)? {
        let bytes = fs::read(&file.path).map_err(|e| format!("Could not read {}: {e}", file.filename))?;
        local.insert(file.relative.clone(), Local { sha: blob_sha(&bytes), bytes, file });
    }
    Ok(local)
}

fn require_student(current: &CurrentUser) -> Result<String, String> {
    let user = current.get()?;
    if user.starts_with(GUEST_PREFIX) {
        return Err("Guests can't sync. Sign in with GitHub to save your code.".into());
    }
    Ok(user)
}

// --- What's unsynced ----------------------------------------------------------------

fn filename_of(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

/// How much of `old` is in `new`, from 0 to 1, the way git scores renames:
/// the bytes of lines they share, over the larger file's size.
fn similarity(old: &[u8], new: &[u8]) -> f64 {
    if old.is_empty() && new.is_empty() {
        return 1.0;
    }
    let mut lines: HashMap<&[u8], usize> = HashMap::new();
    for line in old.split_inclusive(|&b| b == b'\n') {
        *lines.entry(line).or_default() += 1;
    }
    let mut shared = 0;
    for line in new.split_inclusive(|&b| b == b'\n') {
        if let Some(count) = lines.get_mut(line).filter(|count| **count > 0) {
            *count -= 1;
            shared += line.len();
        }
    }
    shared as f64 / old.len().max(new.len()) as f64
}

/// Like git, a deleted file and a new one at least this similar are a rename.
const RENAME_SIMILARITY: f64 = 0.5;

/// What differs from the last sync, as repo paths.
#[derive(Default)]
struct Pending {
    added: Vec<String>,
    modified: Vec<String>,
    deleted: Vec<String>,
    /// (old path, new path)
    renamed: Vec<(String, String)>,
}

impl Pending {
    fn count(&self) -> usize {
        self.added.len() + self.modified.len() + self.deleted.len() + self.renamed.len()
    }
}

fn pending(local: &HashMap<String, Local>, synced: &HashMap<String, Synced>) -> Pending {
    let mut changes = Pending::default();
    for (path, file) in local {
        match synced.get(path) {
            None => changes.added.push(path.clone()),
            Some(old) if old.sha != file.sha => changes.modified.push(path.clone()),
            Some(_) => {}
        }
    }
    changes.deleted = synced.keys().filter(|path| !local.contains_key(*path)).cloned().collect();

    // Pair deleted and new files of the same language, most similar first.
    let ext = |path: &str| split_extension(filename_of(path)).map(|(_, ext)| ext.to_owned());
    let mut candidates = Vec::new();
    for old_path in &changes.deleted {
        let old = &synced[old_path];
        for new_path in &changes.added {
            if ext(old_path) != ext(new_path) {
                continue;
            }
            let new = &local[new_path];
            let score = if old.sha == new.sha {
                1.0
            } else {
                old.content.as_deref().map_or(0.0, |content| similarity(content, &new.bytes))
            };
            if score >= RENAME_SIMILARITY {
                candidates.push((score, old_path.clone(), new_path.clone()));
            }
        }
    }
    candidates.sort_by(|a, b| b.0.total_cmp(&a.0));
    let mut used = HashSet::new();
    for (_, old_path, new_path) in candidates {
        if !used.contains(&old_path) && !used.contains(&new_path) {
            used.insert(old_path.clone());
            used.insert(new_path.clone());
            changes.renamed.push((old_path, new_path));
        }
    }
    changes.added.retain(|path| !used.contains(path));
    changes.deleted.retain(|path| !used.contains(path));
    changes.added.sort();
    changes.modified.sort();
    changes.deleted.sort();
    changes.renamed.sort();
    changes
}

#[derive(Serialize)]
pub struct Rename {
    from: String,
    to: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    /// Filename -> "new" (not on GitHub yet) or "modified".
    changes: BTreeMap<String, &'static str>,
    /// Filenames deleted here but still on GitHub.
    deleted: Vec<String>,
    /// Files renamed (and maybe edited a little) since the last sync.
    renamed: Vec<Rename>,
}

/// What would be pushed by Sync. Empty for guests.
#[tauri::command]
pub fn sync_status(app: AppHandle, current: State<CurrentUser>, db: State<Db>) -> Result<SyncStatus, String> {
    let mut status = SyncStatus { changes: BTreeMap::new(), deleted: Vec::new(), renamed: Vec::new() };
    let Ok(user) = require_student(&current) else { return Ok(status) };
    let local = local_files(&app, &db, &user)?;
    let synced = db.with(|conn| synced(conn, &user))?;
    let changes = pending(&local, &synced);
    for path in &changes.added {
        status.changes.insert(filename_of(path).to_owned(), "new");
    }
    for path in &changes.modified {
        status.changes.insert(filename_of(path).to_owned(), "modified");
    }
    status.deleted = changes.deleted.iter().map(|path| filename_of(path).to_owned()).collect();
    status.renamed = changes
        .renamed
        .iter()
        .map(|(from, to)| Rename { from: filename_of(from).to_owned(), to: filename_of(to).to_owned() })
        .collect();
    Ok(status)
}

// --- Syncing ----------------------------------------------------------------------------

/// Only one sync at a time.
#[derive(Default)]
pub struct SyncLock(tokio::sync::Mutex<()>);

/// The signed-in student's current one-hour GitHub token (with whose it is),
/// reused until shortly before it expires. Only ever in memory.
#[derive(Default)]
pub struct RepoTokens(Mutex<Option<(String, RepoToken)>>);

impl RepoTokens {
    pub fn clear(&self) {
        *self.0.lock().unwrap_or_else(|e| e.into_inner()) = None;
    }
}

/// A token for `user`'s `prepcode-programs` repo: the cached one, or a new one
/// from the account system.
async fn repo_token(app: &AppHandle, db: &Db, user: &str) -> Result<RepoToken, String> {
    fetch_repo_token(app, db, user).await.map_err(|e| e.message())
}

async fn fetch_repo_token(app: &AppHandle, db: &Db, user: &str) -> Result<RepoToken, AccountError> {
    let tokens = app.state::<RepoTokens>();
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    if let Some((owner, token)) = tokens.0.lock().unwrap_or_else(|e| e.into_inner()).as_ref() {
        if owner == user && token.expires_at > now + 5 * 60 {
            return Ok(token.clone());
        }
    }
    let access = auth::access_token(db, &app.state::<AccessToken>()).await.map_err(AccountError::Other)?;
    let token = account::repo_token(&access).await?;
    *tokens.0.lock().unwrap_or_else(|e| e.into_inner()) = Some((user.to_owned(), token.clone()));
    Ok(token)
}

// --- Setting up the repo ----------------------------------------------------------------

/// Where GitHub creates a repo, with prepcode's filled in.
const NEW_REPO_URL: &str =
    "https://github.com/new?name=prepcode-programs&visibility=public&description=Programs+saved+from+prepcode";

/// Whether the signed-in student's GitHub is ready for syncing, and if not,
/// what's left. Mirrors RepoSetup in src/lib/sync.ts.
#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum RepoSetup {
    /// prepcode can sync with their `prepcode-programs` repo.
    Ready,
    /// They have no `prepcode-programs` repo, and prepcode couldn't create
    /// one: they create it on GitHub (`url`, with the name filled in).
    NeedsRepo { url: String },
    /// The repo exists; they give the prepcodes app access to it (`url`, with
    /// their account and only that repo selected).
    NeedsAccess { url: String },
    /// Couldn't find out (e.g. offline). The app opens anyway; Sync says what's
    /// wrong later.
    Unknown { message: String },
}

/// The prepcodes install page for `github_id`, with only `repo_id` selected
/// (without a repo id, GitHub would select all their repos).
fn install_url(github_id: u64, repo_id: u64) -> String {
    format!(
        "https://github.com/apps/prepcodes/installations/new/permissions\
         ?suggested_target_id={github_id}&repository_ids[]={repo_id}"
    )
}

/// Checks the signed-in student's repo access, and gets their repo ready if it
/// isn't: right after they approved GitHub in the browser, their GitHub token
/// creates `prepcode-programs` if it doesn't exist yet. The app shows what's
/// left (see RepoSetup), and calls this again until it's Ready.
#[tauri::command]
pub async fn repo_setup(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
) -> Result<RepoSetup, String> {
    let user = require_student(&current)?;
    match fetch_repo_token(&app, &db, &user).await {
        Ok(_) => {
            // Ready: the GitHub token isn't needed any more.
            app.state::<GitHubUserToken>().clear();
            return Ok(RepoSetup::Ready);
        }
        Err(AccountError::NotSetUp(_)) => {}
        Err(e) => return Ok(RepoSetup::Unknown { message: e.message() }),
    }

    let account = auth::saved_account(&db)?.ok_or("You're not logged in.")?;
    let github_token = app.state::<GitHubUserToken>().get(account.github_id);
    let unknown = |e: github::GitHubError| RepoSetup::Unknown { message: e.message() };
    let found = match github::find_repo(github_token.as_deref(), &account.github_login).await {
        Ok(found) => found,
        Err(e) => return Ok(unknown(e)),
    };
    let repo_id = match (found, github_token) {
        (Some(id), _) => id,
        (None, Some(token)) => match github::create_repo(&token).await {
            Ok(id) => {
                log::info!("Created the student's prepcode-programs repo");
                id
            }
            Err(e) => {
                log::warn!("Could not create the student's repo, so they create it on GitHub: {e:?}");
                return Ok(RepoSetup::NeedsRepo { url: NEW_REPO_URL.into() });
            }
        },
        (None, None) => return Ok(RepoSetup::NeedsRepo { url: NEW_REPO_URL.into() }),
    };
    Ok(RepoSetup::NeedsAccess { url: install_url(account.github_id, repo_id) })
}

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    /// Files committed to GitHub (added, changed or deleted).
    pushed: usize,
    /// Filenames whose content came from GitHub (new or changed there).
    updated: Vec<String>,
    /// Filenames deleted because they were deleted on GitHub.
    deleted: Vec<String>,
    /// Local copies kept under a new name because GitHub's version differed.
    conflicts: Vec<String>,
    repo_url: String,
}

/// Pulls, then (with `push`) commits and pushes everything changed here.
#[tauri::command]
pub async fn sync_now(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    lock: State<'_, SyncLock>,
    workspace_lock: State<'_, WorkspaceLock>,
) -> Result<SyncReport, String> {
    let user = require_student(&current)?;
    let Ok(_guard) = lock.0.try_lock() else {
        return Err("Already syncing.".into());
    };
    let result = sync(&app, &db, &workspace_lock, &user, true).await;
    log_sync("Sync", &result);
    result
}

/// Brings down what changed on GitHub without pushing anything (at sign-in).
#[tauri::command]
pub async fn pull_from_github(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    lock: State<'_, SyncLock>,
    workspace_lock: State<'_, WorkspaceLock>,
) -> Result<SyncReport, String> {
    let user = require_student(&current)?;
    let _guard = lock.0.lock().await;
    let result = sync(&app, &db, &workspace_lock, &user, false).await;
    log_sync("Pull from GitHub", &result);
    result
}

/// Counts only for Sentry; the error (which may name a file) in the log file only.
fn log_sync(what: &str, result: &Result<SyncReport, String>) {
    match result {
        Ok(report) => log::info!(
            "{what}: {} pushed, {} updated, {} deleted, {} conflicts",
            report.pushed,
            report.updated.len(),
            report.deleted.len(),
            report.conflicts.len()
        ),
        Err(e) => {
            log::warn!("{what} failed");
            log::warn!(target: crate::reporting::LOCAL, "{what} failed: {e}");
        }
    }
}

async fn sync(
    app: &AppHandle,
    db: &Db,
    workspace_lock: &WorkspaceLock,
    user: &str,
    push: bool,
) -> Result<SyncReport, String> {
    let msg = |e: GitHubError| e.message();
    // The account system only hands out a token for the GitHub account this
    // prepcode account signed up with, whose id names the workspace.
    let RepoToken { token, github_login: owner, .. } = repo_token(app, db, user).await?;
    let github_id =
        user.strip_prefix("gh-").and_then(|id| id.parse().ok()).ok_or("Sign in with GitHub to sync.")?;
    let author = github::Author::student(github_id, &owner);

    let repo = github::get_repo(&token, &owner).await.map_err(msg)?.ok_or_else(|| {
        format!(
            "{} give prepcode access to your {} repository on GitHub.",
            account::CONNECT_GITHUB,
            github::REPO
        )
    })?;
    let branch = &repo.default_branch;

    // A push fails if GitHub moved on meanwhile (another computer synced):
    // then pull again and retry.
    for _ in 0..3 {
        let head = match github::branch_head(&token, &owner, branch).await.map_err(msg)? {
            Some(head) => head,
            None => {
                // An empty repo: give it a first commit to build on.
                github::create_file(&token, &owner, MARKER, MARKER_CONTENT, "Set up prepcode", &author)
                    .await
                    .map_err(msg)?;
                continue;
            }
        };
        let tree_sha = github::commit_tree(&token, &owner, &head).await.map_err(msg)?;
        let tree = github::tree(&token, &owner, &tree_sha).await.map_err(msg)?;

        // Students create the repo themselves, so GitHub's starter files (a
        // README, LICENSE or .gitignore at the top) are fine. Anything in a
        // folder, without the marker, is some other project: leave it alone.
        let has_marker = tree.iter().any(|e| e.path == MARKER);
        let has_others = tree.iter().any(|e| e.kind == "blob" && e.path.contains('/'));
        if !has_marker && has_others {
            return Err(format!(
                "Your \"{}\" repository on GitHub already holds another project. Rename it on GitHub, \
                 create an empty one with that name for prepcode, then sync again.",
                github::REPO
            ));
        }

        // Programs in the repo: `<date folder>/<name>.<supported ext>`.
        let extensions = db.with(|conn| catalog::extensions(conn))?;
        let remote: HashMap<String, String> = tree
            .into_iter()
            .filter(|e| e.kind == "blob" && is_program_path(&e.path, &extensions))
            .map(|e| (e.path, e.sha))
            .collect();

        let mut report = pull(app, db, workspace_lock, user, &token, &owner, &remote).await?;
        report.repo_url = repo.html_url.clone();
        if !push {
            return Ok(report);
        }

        // Everything that differs from the last sync, after pulling.
        let local = local_files(app, db, user)?;
        let synced = db.with(|conn| synced(conn, user))?;
        let changes = pending(&local, &synced);
        let mut entries = Vec::new();
        // What each pushed path's synced state becomes.
        let mut pushed: Vec<(String, Option<&Local>)> = Vec::new();
        let written =
            changes.added.iter().chain(&changes.modified).chain(changes.renamed.iter().map(|(_, to)| to));
        for path in written {
            let file = &local[path];
            let content = String::from_utf8(file.bytes.clone())
                .map_err(|_| format!("{} isn't plain text, so it can't be synced.", file.file.filename))?;
            entries.push(json!({ "path": path, "mode": "100644", "type": "blob", "content": content }));
            pushed.push((path.clone(), Some(file)));
        }
        // A rename is a delete and an add; git and GitHub recognise it from
        // the contents, as we did.
        let removed = changes.deleted.iter().chain(changes.renamed.iter().map(|(from, _)| from));
        for path in removed {
            entries.push(json!({ "path": path, "mode": "100644", "type": "blob", "sha": null }));
            pushed.push((path.clone(), None));
        }
        if !has_marker {
            entries
                .push(json!({ "path": MARKER, "mode": "100644", "type": "blob", "content": MARKER_CONTENT }));
        }
        if entries.is_empty() {
            return Ok(report);
        }

        let message = commit_message(&changes);
        let new_tree = github::create_tree(&token, &owner, &tree_sha, entries).await.map_err(msg)?;
        let commit =
            github::create_commit(&token, &owner, &message, &new_tree, &head, &author).await.map_err(msg)?;
        if !github::update_branch(&token, &owner, branch, &commit).await.map_err(msg)? {
            continue;
        }
        db.with(|conn| {
            for (path, file) in &pushed {
                set_synced(conn, user, path, file.map(|f| (f.sha.as_str(), f.bytes.as_slice())))?;
            }
            Ok(())
        })?;
        report.pushed = changes.count();
        return Ok(report);
    }
    Err("Your GitHub repo kept changing while syncing. Please try again.".into())
}

/// Whether a repo path is one of the student's programs.
fn is_program_path(path: &str, extensions: &HashSet<String>) -> bool {
    let Some((folder, filename)) = path.split_once('/') else { return false };
    let Some((name, ext)) = split_extension(filename) else { return false };
    files::is_date_folder(folder)
        && extensions.contains(ext)
        && !name.is_empty()
        && name.len() <= 64
        && !name.starts_with('-')
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// How many files a pull downloads at once.
const PARALLEL_DOWNLOADS: usize = 6;

/// A file's content from GitHub, and when it last changed there.
struct Download {
    bytes: Vec<u8>,
    changed: Option<SystemTime>,
}

async fn download(token: &str, owner: &str, path: String, sha: String) -> Result<(String, Download), String> {
    let bytes = github::blob(token, owner, &sha).await.map_err(|e| e.message())?;
    // Dated by its last change on GitHub, not by this download, so Programs
    // lists it under the day it was written. Best effort: without it, the
    // file just shows as changed now.
    let changed = github::last_changed(token, owner, &path).await.ok().flatten();
    Ok((path, Download { bytes, changed }))
}

/// Applies what changed on GitHub since the last sync to the workspace.
///
/// The student can save while this runs, so each file is checked again,
/// under `workspace_lock`, right before it's overwritten or deleted.
async fn pull(
    app: &AppHandle,
    db: &Db,
    workspace_lock: &WorkspaceLock,
    user: &str,
    token: &str,
    owner: &str,
    remote: &HashMap<String, String>,
) -> Result<SyncReport, String> {
    let workspace = workspace_dir(app, user)?;
    let extensions = db.with(|conn| catalog::extensions(conn))?;
    let local = local_files(app, db, user)?;
    let synced = db.with(|conn| synced(conn, user))?;
    let mut report = SyncReport::default();

    let paths: BTreeSet<String> = remote.keys().chain(synced.keys()).chain(local.keys()).cloned().collect();

    // Download everything new or changed on GitHub first, a few at a time
    // (each file is two requests: its content and its date). The loop below
    // then applies them in order, checking each file as it is right then.
    let wanted: Vec<(String, String)> = paths
        .iter()
        .filter_map(|path| {
            let there = remote.get(path)?;
            let here = local.get(path).map(|l| &l.sha);
            let base = synced.get(path).map(|old| &old.sha);
            (here != Some(there) && base != Some(there)).then(|| (path.clone(), there.clone()))
        })
        .collect();
    let mut downloads: HashMap<String, Download> = futures_util::stream::iter(wanted)
        .map(|(path, sha)| download(token, owner, path, sha))
        .buffer_unordered(PARALLEL_DOWNLOADS)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<_, _>>()?;

    for path in paths {
        let base = synced.get(&path).map(|old| old.sha.as_str());
        let here = local.get(&path).map(|l| l.sha.clone());
        let here = here.as_deref();
        let there = remote.get(&path).map(String::as_str);
        let filename = path.rsplit('/').next().unwrap_or(&path).to_owned();

        // The same on both sides.
        if here == there {
            let file = local.get(&path).map(|l| (l.sha.as_str(), l.bytes.as_slice()));
            db.with(|conn| set_synced(conn, user, &path, file))?;
            continue;
        }
        // Only changed here: Sync pushes it.
        if there == base {
            continue;
        }

        match there {
            // New or changed on GitHub: download it.
            Some(sha) => {
                let Some(Download { bytes, changed }) = downloads.remove(&path) else { continue };
                let _guard = workspace_lock.lock();
                // The files as they are now, not when the pull started.
                let mut current = files::workspace_files(&workspace, &extensions)?;
                let mut taken: HashSet<String> = current.iter().map(|f| f.filename.clone()).collect();

                // Changed here too (in a different way): keep both.
                if let Some(i) = current.iter().position(|f| f.relative == path) {
                    let now = fs::read(&current[i].path)
                        .map(|bytes| blob_sha(&bytes))
                        .map_err(|e| format!("Could not read {filename}: {e}"))?;
                    if Some(now.as_str()) != base && now != *sha {
                        let copy = current.remove(i);
                        report.conflicts.push(keep_copy(&copy, &mut taken)?);
                    }
                }
                // A different local file with the same name (made separately
                // on two computers) steps aside too.
                if let Some(i) = current
                    .iter()
                    .position(|f| f.relative != path && f.filename.eq_ignore_ascii_case(&filename))
                {
                    let copy = current.remove(i);
                    report.conflicts.push(keep_copy(&copy, &mut taken)?);
                }

                let target = workspace.join(&path);
                if let Some(folder) = target.parent() {
                    fs::create_dir_all(folder).map_err(|e| format!("Could not save {filename}: {e}"))?;
                }
                fs::write(&target, &bytes).map_err(|e| format!("Could not save {filename}: {e}"))?;
                if let Some(changed) = changed {
                    let _ =
                        fs::File::options().write(true).open(&target).and_then(|f| f.set_modified(changed));
                }
                db.with(|conn| set_synced(conn, user, &path, Some((sha, bytes.as_slice()))))?;
                report.updated.push(filename);
            }
            // Deleted on GitHub.
            None => {
                if here.is_some() && here == base {
                    let _guard = workspace_lock.lock();
                    let target = workspace.join(&path);
                    // Unless it was saved meanwhile.
                    let unchanged =
                        fs::read(&target).is_ok_and(|bytes| Some(blob_sha(&bytes).as_str()) == base);
                    if unchanged && fs::remove_file(&target).is_ok() {
                        report.deleted.push(filename);
                    }
                }
                // If it was changed here, it's kept and pushed back as new.
                db.with(|conn| set_synced(conn, user, &path, None))?;
            }
        }
    }
    remove_empty_folders(&workspace);
    Ok(report)
}

/// Renames the student's copy of a file out of the way, to a conflict name not
/// in `taken` (which then includes it). Returns the new filename.
fn keep_copy(file: &WorkspaceFile, taken: &mut HashSet<String>) -> Result<String, String> {
    let new_name = conflict_name(&file.filename, taken);
    fs::rename(&file.path, file.path.with_file_name(&new_name))
        .map_err(|e| format!("Could not keep your copy of {}: {e}", file.filename))?;
    taken.insert(new_name.clone());
    Ok(new_name)
}

/// `code2.py` -> `code2_conflict.py` (or `_conflict2`, …), not in `taken`.
fn conflict_name(filename: &str, taken: &HashSet<String>) -> String {
    let (stem, ext) = split_extension(filename).unwrap_or((filename, ""));
    let taken: HashSet<String> = taken.iter().map(|t| t.to_lowercase()).collect();
    (1..)
        .map(|n| {
            let suffix = if n == 1 { "_conflict".to_owned() } else { format!("_conflict{n}") };
            // Names are at most 64 characters.
            let stem: String = stem.chars().take(64 - suffix.len()).collect();
            format!("{stem}{suffix}.{ext}")
        })
        .find(|name| !taken.contains(&name.to_lowercase()))
        .expect("some name is free")
}

/// e.g. "Add loop.py, rename a.py to b.py" or "Add 4 files, delete 1 file".
fn commit_message(changes: &Pending) -> String {
    let names = |paths: &[String]| paths.iter().map(|p| filename_of(p).to_owned()).collect::<Vec<_>>();
    let renames: Vec<String> = changes
        .renamed
        .iter()
        .map(|(from, to)| format!("{} to {}", filename_of(from), filename_of(to)))
        .collect();
    let groups = [
        ("add", names(&changes.added), changes.added.len()),
        ("update", names(&changes.modified), changes.modified.len()),
        ("rename", renames, changes.renamed.len()),
        ("delete", names(&changes.deleted), changes.deleted.len()),
    ];
    let parts: Vec<String> = groups
        .iter()
        .filter(|(_, _, count)| *count > 0)
        .map(|(verb, names, count)| {
            if changes.count() <= 3 {
                format!("{verb} {}", names.join(", "))
            } else {
                let noun = if *count == 1 { "file" } else { "files" };
                format!("{verb} {count} {noun}")
            }
        })
        .collect();
    let message = if parts.is_empty() { "Set up prepcode".to_owned() } else { parts.join(", ") };
    let mut chars = message.chars();
    chars.next().map(|c| c.to_uppercase().chain(chars).collect()).unwrap_or_default()
}

fn remove_empty_folders(workspace: &Path) {
    let Ok(entries) = fs::read_dir(workspace) else { return };
    for entry in entries.flatten() {
        let is_date = entry.file_name().to_str().is_some_and(files::is_date_folder);
        if is_date {
            // Only succeeds if the folder is empty.
            let _ = fs::remove_dir(entry.path());
        }
    }
}

/// At log out: deletes this student's synced files from the computer (they're
/// on GitHub). Unsynced ones stay, to sync at their next sign-in here.
pub fn remove_synced_files(app: &AppHandle, db: &Db, user: &str) -> Result<(), String> {
    let local = local_files(app, db, user)?;
    let synced = db.with(|conn| synced(conn, user))?;
    for (path, file) in &local {
        let unchanged = synced.get(path).is_some_and(|old| old.sha == file.sha);
        if unchanged && fs::remove_file(&file.file.path).is_ok() {
            db.with(|conn| set_synced(conn, user, path, None))?;
        }
    }
    remove_empty_folders(&workspace_dir(app, user)?);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn install_url_selects_only_the_repo() {
        assert_eq!(
            install_url(323292969, 1401456644),
            "https://github.com/apps/prepcodes/installations/new/permissions\
             ?suggested_target_id=323292969&repository_ids[]=1401456644"
        );
    }

    #[test]
    fn blob_sha_matches_git() {
        // `printf 'hello\n' | git hash-object --stdin`
        assert_eq!(blob_sha(b"hello\n"), "ce013625030ba8dba906f756967f9e9ca394464a");
        assert_eq!(blob_sha(b""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
    }

    #[test]
    fn conflict_names() {
        let taken: HashSet<String> = ["code2.py".into(), "Code2_conflict.py".into()].into();
        assert_eq!(conflict_name("code2.py", &taken), "code2_conflict2.py");
        assert_eq!(conflict_name("a.c", &HashSet::new()), "a_conflict.c");
        assert_eq!(conflict_name("q.mysql.sql", &HashSet::new()), "q_conflict.mysql.sql");
        let long = format!("{}.py", "x".repeat(64));
        assert_eq!(conflict_name(&long, &HashSet::new()).len(), 64 + ".py".len());
    }

    fn pending_of(added: &[&str], modified: &[&str], deleted: &[&str], renamed: &[(&str, &str)]) -> Pending {
        let v = |xs: &[&str]| xs.iter().map(|x| format!("02oct2026/{x}")).collect();
        Pending {
            added: v(added),
            modified: v(modified),
            deleted: v(deleted),
            renamed: renamed
                .iter()
                .map(|(a, b)| (format!("02oct2026/{a}"), format!("02oct2026/{b}")))
                .collect(),
        }
    }

    #[test]
    fn commit_messages() {
        assert_eq!(
            commit_message(&pending_of(&["loop.py"], &["code2.py"], &[], &[])),
            "Add loop.py, update code2.py"
        );
        assert_eq!(commit_message(&pending_of(&[], &[], &[], &[("a.py", "b.py")])), "Rename a.py to b.py");
        assert_eq!(
            commit_message(&pending_of(&["a.py", "b.py", "c.py"], &[], &["d.py"], &[])),
            "Add 3 files, delete 1 file"
        );
    }

    fn local(path: &str, content: &str) -> (String, Local) {
        let file = WorkspaceFile {
            filename: filename_of(path).to_owned(),
            relative: path.to_owned(),
            path: path.into(),
        };
        let bytes = content.as_bytes().to_vec();
        (path.to_owned(), Local { sha: blob_sha(&bytes), bytes, file })
    }

    fn synced_file(path: &str, content: &str) -> (String, Synced) {
        let content = content.as_bytes().to_vec();
        (path.to_owned(), Synced { sha: blob_sha(&content), content: Some(content) })
    }

    #[test]
    fn recognises_renames_like_git() {
        let program = "a = 1\nb = 2\nc = 3\nprint(a + b + c)\n";
        // Renamed, unchanged.
        let changes = pending(
            &[local("02oct2026/new.py", program)].into(),
            &[synced_file("02oct2026/old.py", program)].into(),
        );
        assert_eq!(changes.renamed, [("02oct2026/old.py".into(), "02oct2026/new.py".into())]);
        assert!(changes.added.is_empty() && changes.deleted.is_empty());

        // Renamed and edited a little: still a rename.
        let edited = "a = 1\nb = 2\nc = 30\nprint(a + b + c)\n";
        let changes = pending(
            &[local("02oct2026/new.py", edited)].into(),
            &[synced_file("02oct2026/old.py", program)].into(),
        );
        assert_eq!(changes.renamed.len(), 1);

        // Mostly rewritten: a delete and a new file.
        let changes = pending(
            &[local("02oct2026/new.py", "print('something else entirely')\n")].into(),
            &[synced_file("02oct2026/old.py", program)].into(),
        );
        assert!(changes.renamed.is_empty());
        assert_eq!((changes.added.len(), changes.deleted.len()), (1, 1));

        // Different languages are never a rename.
        let changes = pending(
            &[local("02oct2026/new.js", program)].into(),
            &[synced_file("02oct2026/old.py", program)].into(),
        );
        assert!(changes.renamed.is_empty());
    }

    #[test]
    fn program_paths() {
        let ext: HashSet<String> = ["py".into(), "c".into(), "mysql.sql".into()].into();
        assert!(is_program_path("02oct2026/code2.py", &ext));
        assert!(is_program_path("02oct2026/queries.mysql.sql", &ext));
        assert!(!is_program_path("02oct2026/queries.sql", &ext));
        assert!(!is_program_path("code2.py", &ext));
        assert!(!is_program_path("README.md", &ext));
        assert!(!is_program_path("02oct2026/notes.txt", &ext));
        assert!(!is_program_path("02oct2026/my file.py", &ext));
        assert!(!is_program_path("02oct2026/sub/code.py", &ext));
    }
}
