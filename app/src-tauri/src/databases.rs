//! Each account's own databases.
//!
//! A database's runtime (e.g. the MySQL server) is downloaded once per
//! computer like any language. Its data is per account: every student gets
//! their own folder, created by the catalog's `setup` steps the first time they
//! pick that database, so nobody can see or change another student's tables.
//!
//! Data lives in the per-user local app data folder, never the shared one, and
//! not the roaming one either: database files are big and change constantly.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Stdio;

use tauri::{AppHandle, Manager};

use crate::catalog::{Language, Runtime, Vars};
use crate::runtimes::{runtime_dir, shared_data_dir, step_command, write_step_files};

/// Where every account's database folders live.
pub fn databases_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| dir.join("databases"))
        .map_err(|e| format!("Could not locate app data folder: {e}"))
}

/// The account's data folder for one database, e.g. `databases/gh-123/mysql`.
pub fn data_dir(app: &AppHandle, account: &str, language: &Language) -> Result<PathBuf, String> {
    Ok(databases_dir(app)?.join(account).join(folder_name(language)))
}

/// `mysql.sql` -> `mysql`: the database's part of the extension, which stays
/// the same if how its files are named changes (they were once `.mysql`).
fn folder_name(language: &Language) -> &str {
    language.extension.split('.').next().unwrap_or(&language.extension)
}

/// Whether the account can use `language` without setting anything up first.
pub fn is_set_up(app: &AppHandle, account: &str, language: &Language) -> Result<bool, String> {
    Ok(language.setup.is_empty() || data_dir(app, account, language)?.is_dir())
}

/// Sets up the account's data folder for `language`, if it isn't already.
pub fn set_up(
    app: &AppHandle,
    account: &str,
    language: &Language,
    runtime: &Runtime,
    exe: &Path,
) -> Result<(), String> {
    let vars =
        Vars::default().set("shared", shared_data_dir(app)?).set("runtime", runtime_dir(app, runtime)?);
    set_up_in(&data_dir(app, account, language)?, language, runtime, exe, vars)
}

/// Runs the database's setup steps into a scratch folder, then moves it to
/// `target` with a single rename, so a half-made folder (the app closed
/// midway) is never mistaken for a ready one; the next attempt starts over.
pub(crate) fn set_up_in(
    target: &Path,
    language: &Language,
    runtime: &Runtime,
    exe: &Path,
    vars: Vars,
) -> Result<(), String> {
    if target.is_dir() {
        return Ok(());
    }
    let parent = target.parent().ok_or("Invalid database folder.")?;
    fs::create_dir_all(parent).map_err(|e| format!("Could not create your database folder: {e}"))?;
    let staging = parent.join(format!(".{}.setup", folder_name(language)));
    let _ = fs::remove_dir_all(&staging);
    let vars = vars.set("data", &staging);

    let result = (|| {
        for step in &language.setup {
            write_step_files(step, parent)?;
            let mut command = step_command(step, runtime, exe, &vars);
            command.current_dir(parent).stdin(Stdio::null());
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
            }
            let output = command.output().map_err(|e| format!("Could not set up {}: {e}", language.name))?;
            if !output.status.success() {
                return Err(format!(
                    "Could not set up {} ({}).{}",
                    language.name,
                    output.status,
                    last_lines(&output.stderr, &output.stdout)
                ));
            }
        }
        // Some databases create their folder on first start instead.
        fs::create_dir_all(&staging).map_err(|e| format!("Could not create your database folder: {e}"))?;
        fs::rename(&staging, target)
            .map_err(|e| format!("Could not finish setting up {}: {e}", language.name))
    })();

    if result.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    result
}

/// The end of what a failed setup printed, to show the student (and us).
fn last_lines(stderr: &[u8], stdout: &[u8]) -> String {
    let text = String::from_utf8_lossy(if stderr.is_empty() { stdout } else { stderr });
    let lines: Vec<_> = text.lines().filter(|line| !line.trim().is_empty()).collect();
    match lines.len() {
        0 => String::new(),
        n => format!("\n{}", lines[n.saturating_sub(5)..].join("\n")),
    }
}

#[cfg(test)]
pub(crate) mod tests {
    pub(crate) use super::set_up_in;
    use super::*;
    use crate::catalog::{self, Kind};
    use crate::runtimes::tests::install_for_this_platform;

    /// Real network install, then an account's setup, in a temp folder.
    /// Run with: cargo test -- --ignored
    #[test]
    fn folders_are_named_for_the_database() {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let mysql = catalog.languages.iter().find(|l| l.extension == "mysql.sql").unwrap();
        assert_eq!(folder_name(mysql), "mysql");
    }

    #[test]
    #[ignore = "downloads ~170-280 MB"]
    fn sets_up_mysql() {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let language = catalog.languages.iter().find(|l| l.kind == Kind::Database).unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id == language.runtime).unwrap();
        install_for_this_platform(&runtime.id, |root| {
            let target = root.parent().unwrap().join("accounts").join("gh-1").join(folder_name(language));
            let exe = root.join(runtime.executable());
            let vars = Vars::default().set("runtime", root);
            set_up_in(&target, language, runtime, &exe, vars).expect("setup failed");
            assert!(target.join("mysql.ibd").is_file());
            // A second call finds it done.
            set_up_in(&target, language, runtime, &exe, Vars::default()).unwrap();
        });
    }
}
