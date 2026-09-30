//! prepcode's local database: students' accounts and the language catalog.
//!
//! It lives in the per-user app data folder, so on a shared lab PC one
//! Windows account can't change what another account's prepcode runs.

use std::fs;
use std::path::Path;
use std::sync::Mutex;

use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::catalog;

/// The open database. Commands lock it only briefly, never across an `.await`.
pub struct Db(Mutex<Connection>);

impl Db {
    /// Runs `f` with the connection. Errors become user-facing messages.
    pub fn with<T>(&self, f: impl FnOnce(&mut Connection) -> Result<T, String>) -> Result<T, String> {
        let mut conn = self.0.lock().unwrap_or_else(|e| e.into_inner());
        f(&mut conn)
    }
}

/// Schema changes, applied in order. `PRAGMA user_version` records how many
/// have run. Only ever append: an installed app may have run the earlier ones.
const MIGRATIONS: &[&str] = &["
    CREATE TABLE users (
        reg_no TEXT PRIMARY KEY,
        dob    TEXT NOT NULL
    );
    CREATE TABLE meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    CREATE TABLE runtimes (
        id           TEXT PRIMARY KEY,
        exe_windows  TEXT NOT NULL,
        exe_macos    TEXT NOT NULL,
        exe_linux    TEXT NOT NULL,
        version_args TEXT NOT NULL, -- JSON array
        env          TEXT NOT NULL, -- JSON object
        warmup       TEXT NOT NULL  -- JSON array of steps
    );
    CREATE TABLE runtime_downloads (
        runtime_id TEXT NOT NULL REFERENCES runtimes (id) ON DELETE CASCADE,
        os         TEXT NOT NULL,
        arch       TEXT NOT NULL,
        url        TEXT NOT NULL,
        sha256     TEXT NOT NULL,
        kind       TEXT NOT NULL,   -- JSON string: \"zip\", \"tar.gz\" or \"tar.xz\"
        PRIMARY KEY (runtime_id, os, arch)
    );
    CREATE TABLE languages (
        extension  TEXT PRIMARY KEY,
        position   INTEGER NOT NULL,
        name       TEXT NOT NULL,
        monaco     TEXT NOT NULL,
        formatter  TEXT,
        icon       TEXT,
        runtime_id TEXT NOT NULL REFERENCES runtimes (id),
        compile    TEXT,            -- JSON step, NULL if there's no compile step
        run        TEXT NOT NULL    -- JSON step
    );
"];

fn migrate(conn: &mut Connection) -> rusqlite::Result<()> {
    conn.pragma_update(None, "foreign_keys", true)?;
    let applied: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    for (i, migration) in MIGRATIONS.iter().enumerate().skip(applied as usize) {
        let tx = conn.transaction()?;
        tx.execute_batch(migration)?;
        tx.pragma_update(None, "user_version", i as i64 + 1)?;
        tx.commit()?;
    }
    Ok(())
}

/// A migrated database with nothing in it, for tests.
#[cfg(test)]
pub fn open_in_memory() -> rusqlite::Result<Connection> {
    let mut conn = Connection::open_in_memory()?;
    migrate(&mut conn)?;
    Ok(conn)
}

/// Opens (creating if needed) the database, brings it up to date, and loads
/// the bundled catalog if it's newer than the one already there.
pub fn open(app: &AppHandle) -> Result<Db, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Could not locate app data folder: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Could not create app data folder: {e}"))?;

    let mut conn = Connection::open(dir.join("prepcode.db"))
        .map_err(|e| format!("Could not open prepcode's database: {e}"))?;
    migrate(&mut conn).map_err(|e| format!("Could not update prepcode's database: {e}"))?;
    import_legacy_users(&mut conn, &dir)?;
    catalog::import(&mut conn, &catalog::parse(catalog::BUNDLED)?)?;
    Ok(Db(Mutex::new(conn)))
}

/// Before the database, accounts were kept in users.json. Copy them over once,
/// then rename the file so it's kept as a backup but never read again.
fn import_legacy_users(conn: &mut Connection, dir: &Path) -> Result<(), String> {
    #[derive(Deserialize)]
    struct LegacyUser {
        reg_no: String,
        dob: String,
    }

    let path = dir.join("users.json");
    let Ok(raw) = fs::read_to_string(&path) else {
        return Ok(());
    };
    let users: Vec<LegacyUser> =
        serde_json::from_str(&raw).map_err(|e| format!("Accounts file is corrupted: {e}"))?;

    let err = |e: rusqlite::Error| format!("Could not move accounts to the database: {e}");
    let tx = conn.transaction().map_err(err)?;
    for user in &users {
        tx.execute(
            "INSERT OR IGNORE INTO users (reg_no, dob) VALUES (?1, ?2)",
            params![user.reg_no, user.dob],
        )
        .map_err(err)?;
    }
    tx.commit().map_err(err)?;

    fs::rename(&path, dir.join("users.json.migrated"))
        .map_err(|e| format!("Could not move accounts to the database: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_are_idempotent() {
        let mut conn = open_in_memory().unwrap();
        migrate(&mut conn).unwrap();
        let version: i64 = conn.pragma_query_value(None, "user_version", |r| r.get(0)).unwrap();
        assert_eq!(version as usize, MIGRATIONS.len());
    }

    #[test]
    fn imports_legacy_users_once() {
        let dir = std::env::temp_dir().join(format!("prepcode-db-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("users.json"), r#"[{"reg_no":"21CS001","dob":"2004-01-02"}]"#).unwrap();

        let mut conn = open_in_memory().unwrap();
        import_legacy_users(&mut conn, &dir).unwrap();
        let dob: String = conn
            .query_row("SELECT dob FROM users WHERE reg_no = '21CS001'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(dob, "2004-01-02");
        assert!(!dir.join("users.json").exists());
        assert!(dir.join("users.json.migrated").exists());

        fs::remove_dir_all(&dir).unwrap();
    }
}
