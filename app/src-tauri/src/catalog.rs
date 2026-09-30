//! The language catalog: which languages prepcode supports, the runtime that
//! runs each one, and how to compile and run a program in it.
//!
//! Nothing here knows about any particular language. Everything comes from a
//! catalog document (see `catalog/catalog.json`), imported into the database.
//! The bundled document seeds a fresh install; a newer one (e.g. from a server
//! later) replaces it through the same `import`.

use std::collections::{BTreeMap, HashSet};
use std::path::{Component, Path};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::Db;

/// The catalog shipped with this build of prepcode.
pub const BUNDLED: &str = include_str!("../catalog/catalog.json");

#[derive(Deserialize)]
pub struct Catalog {
    /// Bumped on every change, so an older catalog never replaces a newer one.
    pub version: i64,
    pub runtimes: Vec<Runtime>,
    /// In the order languages appear in the app.
    pub languages: Vec<Language>,
}

#[derive(Clone, Deserialize)]
pub struct Exe {
    pub windows: String,
    pub macos: String,
    pub linux: String,
}

#[derive(Clone, Copy, PartialEq, Debug, Serialize, Deserialize)]
pub enum ArchiveKind {
    #[serde(rename = "zip")]
    Zip,
    #[serde(rename = "tar.gz")]
    TarGz,
    #[serde(rename = "tar.xz")]
    TarXz,
}

#[derive(Clone, Deserialize)]
pub struct Download {
    /// As reported by std::env::consts::{OS, ARCH}.
    pub os: String,
    pub arch: String,
    pub url: String,
    pub sha256: String,
    pub kind: ArchiveKind,
}

/// A portable runtime, unpacked into `runtimes/<id>/`.
#[derive(Clone, Deserialize)]
pub struct Runtime {
    /// Folder name under runtimes/; includes the version so upgrades never collide.
    pub id: String,
    /// Main executable, relative to the runtime folder, per OS.
    pub exe: Exe,
    /// Arguments that make the executable print its version (used to verify the install).
    pub version_args: Vec<String>,
    /// Environment for every command run with this runtime (placeholders allowed).
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    /// Commands run once after installing, e.g. to fill a compiler's cache.
    #[serde(default)]
    pub warmup: Vec<Step>,
    pub downloads: Vec<Download>,
}

impl Runtime {
    pub fn executable(&self) -> &str {
        match std::env::consts::OS {
            "windows" => &self.exe.windows,
            "macos" => &self.exe.macos,
            _ => &self.exe.linux,
        }
    }

    pub fn download(&self) -> Option<&Download> {
        let (os, arch) = (std::env::consts::OS, std::env::consts::ARCH);
        self.downloads.iter().find(|d| d.os == os && d.arch == arch)
    }
}

/// One command. Strings may use placeholders like `{source}`; see `Vars`.
#[derive(Clone, Default, Serialize, Deserialize)]
pub struct Step {
    /// What to run; the runtime's executable if omitted.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub program: Option<String>,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    /// Files written next to the build before running, as name -> contents.
    #[serde(default)]
    pub files: BTreeMap<String, String>,
}

#[derive(Clone, Deserialize)]
pub struct Language {
    /// File extension, e.g. "py". Also the language's id.
    pub extension: String,
    /// Shown to students, e.g. "Python".
    pub name: String,
    /// Monaco editor language id.
    pub monaco: String,
    /// Which of the app's built-in formatters to use, if any.
    #[serde(default)]
    pub formatter: Option<String>,
    /// SVG logo shown next to files.
    #[serde(default)]
    pub icon: Option<String>,
    /// Id of the runtime that compiles and runs it.
    pub runtime: String,
    /// Optional compile step. It must write the program to `{binary}`.
    #[serde(default)]
    pub compile: Option<Step>,
    pub run: Step,
}

fn db_err(e: rusqlite::Error) -> String {
    format!("Language catalog error: {e}")
}

/// Letters, digits, `.`, `_` and `-`, and not `.` or `..`. For names that
/// become folder or file names, so a catalog can't write outside its folder.
fn is_safe_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && name != "."
        && name != ".."
        && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

/// A relative path that stays inside the folder it's joined to.
fn is_inner_path(path: &str) -> bool {
    !path.is_empty() && Path::new(path).components().all(|c| matches!(c, Component::Normal(_)))
}

fn validate_step(step: &Step, what: &str) -> Result<(), String> {
    match step.files.keys().find(|name| !is_safe_name(name)) {
        Some(name) => Err(format!("{what}: invalid file name {name:?}")),
        None => Ok(()),
    }
}

/// Rejects a catalog that could escape prepcode's folders or skip verification.
/// Extensions become part of students' filenames, so they're kept strict.
pub fn validate(catalog: &Catalog) -> Result<(), String> {
    let mut runtime_ids = HashSet::new();
    for runtime in &catalog.runtimes {
        let id = &runtime.id;
        if !is_safe_name(id) {
            return Err(format!("Invalid runtime id {id:?}"));
        }
        if !runtime_ids.insert(id.as_str()) {
            return Err(format!("Runtime {id} is listed twice"));
        }
        for exe in [&runtime.exe.windows, &runtime.exe.macos, &runtime.exe.linux] {
            if !is_inner_path(exe) {
                return Err(format!("Runtime {id}: invalid executable path {exe:?}"));
            }
        }
        for download in &runtime.downloads {
            let hash = &download.sha256;
            if hash.len() != 64 || !hash.chars().all(|c| matches!(c, '0'..='9' | 'a'..='f')) {
                return Err(format!("Runtime {id}: invalid SHA-256 {hash:?}"));
            }
            if !download.url.starts_with("https://") {
                return Err(format!("Runtime {id}: downloads must use https://"));
            }
        }
        for step in &runtime.warmup {
            validate_step(step, &format!("Runtime {id} warmup"))?;
        }
    }

    let mut extensions = HashSet::new();
    for language in &catalog.languages {
        let ext = &language.extension;
        if ext.is_empty()
            || ext.len() > 16
            || !ext.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        {
            return Err(format!("Invalid extension {ext:?}"));
        }
        if !extensions.insert(ext.as_str()) {
            return Err(format!("Language .{ext} is listed twice"));
        }
        if language.name.trim().is_empty() {
            return Err(format!("Language .{ext} has no name"));
        }
        if !runtime_ids.contains(language.runtime.as_str()) {
            return Err(format!("Language .{ext} uses unknown runtime {}", language.runtime));
        }
        if let Some(compile) = &language.compile {
            validate_step(compile, &format!("Language .{ext} compile"))?;
        }
        validate_step(&language.run, &format!("Language .{ext} run"))?;
    }
    Ok(())
}

fn to_json<T: Serialize>(value: &T) -> String {
    serde_json::to_string(value).expect("catalog values always serialize")
}

fn from_json<T: for<'de> Deserialize<'de>>(column: usize, raw: String) -> rusqlite::Result<T> {
    serde_json::from_str(&raw).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(column, rusqlite::types::Type::Text, Box::new(e))
    })
}

/// The version of the catalog in the database, or 0 if there's none yet.
pub fn installed_version(conn: &Connection) -> Result<i64, String> {
    conn.query_row("SELECT value FROM meta WHERE key = 'catalog_version'", [], |row| {
        row.get::<_, String>(0)
    })
    .optional()
    .map_err(db_err)
    .map(|v| v.and_then(|v| v.parse().ok()).unwrap_or(0))
}

/// Parses and validates a catalog document.
pub fn parse(raw: &str) -> Result<Catalog, String> {
    let catalog: Catalog =
        serde_json::from_str(raw).map_err(|e| format!("Language catalog is invalid: {e}"))?;
    validate(&catalog)?;
    Ok(catalog)
}

/// Replaces the whole catalog in one transaction, if `catalog` is newer than
/// what's installed. Returns whether it was imported.
pub fn import(conn: &mut Connection, catalog: &Catalog) -> Result<bool, String> {
    validate(catalog)?;
    let tx = conn.transaction().map_err(db_err)?;
    if installed_version(&tx)? >= catalog.version {
        return Ok(false);
    }
    tx.execute_batch("DELETE FROM languages; DELETE FROM runtime_downloads; DELETE FROM runtimes;")
        .map_err(db_err)?;

    for runtime in &catalog.runtimes {
        tx.execute(
            "INSERT INTO runtimes (id, exe_windows, exe_macos, exe_linux, version_args, env, warmup)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                runtime.id,
                runtime.exe.windows,
                runtime.exe.macos,
                runtime.exe.linux,
                to_json(&runtime.version_args),
                to_json(&runtime.env),
                to_json(&runtime.warmup),
            ],
        )
        .map_err(db_err)?;
        for d in &runtime.downloads {
            tx.execute(
                "INSERT INTO runtime_downloads (runtime_id, os, arch, url, sha256, kind)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![runtime.id, d.os, d.arch, d.url, d.sha256, to_json(&d.kind)],
            )
            .map_err(db_err)?;
        }
    }

    for (position, language) in catalog.languages.iter().enumerate() {
        tx.execute(
            "INSERT INTO languages
               (extension, position, name, monaco, formatter, icon, runtime_id, compile, run)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                language.extension,
                position as i64,
                language.name,
                language.monaco,
                language.formatter,
                language.icon,
                language.runtime,
                language.compile.as_ref().map(to_json),
                to_json(&language.run),
            ],
        )
        .map_err(db_err)?;
    }

    tx.execute(
        "INSERT INTO meta (key, value) VALUES ('catalog_version', ?1)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        params![catalog.version.to_string()],
    )
    .map_err(db_err)?;
    tx.commit().map_err(db_err)?;
    Ok(true)
}

const LANGUAGE_COLUMNS: &str =
    "extension, name, monaco, formatter, icon, runtime_id, compile, run FROM languages";

fn language_from_row(row: &rusqlite::Row) -> rusqlite::Result<Language> {
    Ok(Language {
        extension: row.get(0)?,
        name: row.get(1)?,
        monaco: row.get(2)?,
        formatter: row.get(3)?,
        icon: row.get(4)?,
        runtime: row.get(5)?,
        compile: row.get::<_, Option<String>>(6)?.map(|raw| from_json(6, raw)).transpose()?,
        run: from_json(7, row.get(7)?)?,
    })
}

/// Every supported language, in display order.
pub fn languages(conn: &Connection) -> Result<Vec<Language>, String> {
    let mut stmt = conn
        .prepare(&format!("SELECT {LANGUAGE_COLUMNS} ORDER BY position"))
        .map_err(db_err)?;
    let rows = stmt.query_map([], language_from_row).map_err(db_err)?;
    rows.collect::<rusqlite::Result<_>>().map_err(db_err)
}

pub fn language(conn: &Connection, extension: &str) -> Result<Option<Language>, String> {
    conn.query_row(
        &format!("SELECT {LANGUAGE_COLUMNS} WHERE extension = ?1"),
        [extension],
        language_from_row,
    )
    .optional()
    .map_err(db_err)
}

pub fn is_supported(conn: &Connection, extension: &str) -> Result<bool, String> {
    conn.query_row("SELECT 1 FROM languages WHERE extension = ?1", [extension], |_| Ok(()))
        .optional()
        .map(|found| found.is_some())
        .map_err(db_err)
}

pub fn extensions(conn: &Connection) -> Result<HashSet<String>, String> {
    let mut stmt = conn.prepare("SELECT extension FROM languages").map_err(db_err)?;
    let rows = stmt.query_map([], |row| row.get(0)).map_err(db_err)?;
    rows.collect::<rusqlite::Result<_>>().map_err(db_err)
}

pub fn runtime(conn: &Connection, id: &str) -> Result<Runtime, String> {
    let mut runtime = conn
        .query_row(
            "SELECT id, exe_windows, exe_macos, exe_linux, version_args, env, warmup
             FROM runtimes WHERE id = ?1",
            [id],
            |row| {
                Ok(Runtime {
                    id: row.get(0)?,
                    exe: Exe { windows: row.get(1)?, macos: row.get(2)?, linux: row.get(3)? },
                    version_args: from_json(4, row.get(4)?)?,
                    env: from_json(5, row.get(5)?)?,
                    warmup: from_json(6, row.get(6)?)?,
                    downloads: Vec::new(),
                })
            },
        )
        .map_err(db_err)?;

    let mut stmt = conn
        .prepare("SELECT os, arch, url, sha256, kind FROM runtime_downloads WHERE runtime_id = ?1")
        .map_err(db_err)?;
    let rows = stmt
        .query_map([id], |row| {
            Ok(Download {
                os: row.get(0)?,
                arch: row.get(1)?,
                url: row.get(2)?,
                sha256: row.get(3)?,
                kind: from_json(4, row.get(4)?)?,
            })
        })
        .map_err(db_err)?;
    runtime.downloads = rows.collect::<rusqlite::Result<_>>().map_err(db_err)?;
    Ok(runtime)
}

/// What the frontend needs to show a language.
#[derive(Serialize)]
pub struct LanguageInfo {
    extension: String,
    name: String,
    monaco: String,
    formatter: Option<String>,
    icon: Option<String>,
    /// Languages with the same runtime share one download.
    runtime: String,
}

/// Every supported language, in display order.
#[tauri::command]
pub fn list_languages(db: State<Db>) -> Result<Vec<LanguageInfo>, String> {
    let languages = db.with(|conn| languages(conn))?;
    Ok(languages
        .into_iter()
        .map(|l| LanguageInfo {
            extension: l.extension,
            name: l.name,
            monaco: l.monaco,
            formatter: l.formatter,
            icon: l.icon,
            runtime: l.runtime,
        })
        .collect())
}

/// Values for `{name}` placeholders in steps. Unknown placeholders are left as is.
#[derive(Default)]
pub struct Vars(Vec<(&'static str, String)>);

impl Vars {
    pub fn set(mut self, name: &'static str, value: impl AsRef<Path>) -> Self {
        self.0.push((name, value.as_ref().to_string_lossy().into_owned()));
        self
    }

    pub fn expand(&self, text: &str) -> String {
        let mut out = String::with_capacity(text.len());
        let mut rest = text;
        while let Some(start) = rest.find('{') {
            out.push_str(&rest[..start]);
            let after = &rest[start + 1..];
            let value = after.find('}').and_then(|end| {
                let name = &after[..end];
                self.0.iter().find(|(n, _)| *n == name).map(|(_, v)| (v, end))
            });
            match value {
                Some((value, end)) => {
                    out.push_str(value);
                    rest = &after[end + 1..];
                }
                None => {
                    out.push('{');
                    rest = after;
                }
            }
        }
        out.push_str(rest);
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    fn bundled() -> Catalog {
        parse(BUNDLED).expect("bundled catalog is valid")
    }

    #[test]
    fn imports_bundled_catalog() {
        let mut conn = db::open_in_memory().unwrap();
        assert!(import(&mut conn, &bundled()).unwrap());

        let languages = languages(&conn).unwrap();
        let exts: Vec<_> = languages.iter().map(|l| l.extension.as_str()).collect();
        assert_eq!(exts, ["py", "js", "c", "cpp", "java"]);

        let c = language(&conn, "c").unwrap().unwrap();
        assert_eq!(c.run.program.as_deref(), Some("{binary}"));
        assert!(c.compile.unwrap().files.contains_key("prepcode_prelude.h"));

        let zig = runtime(&conn, &c.runtime).unwrap();
        assert_eq!(zig.downloads.len(), 4);
        assert_eq!(zig.warmup.len(), 2);
        assert!(is_supported(&conn, "java").unwrap());
        assert!(!is_supported(&conn, "rb").unwrap());
    }

    #[test]
    fn keeps_newer_catalog() {
        let mut conn = db::open_in_memory().unwrap();
        let mut newer = bundled();
        newer.version += 1;
        newer.languages.retain(|l| l.extension == "py");
        assert!(import(&mut conn, &newer).unwrap());
        assert!(!import(&mut conn, &bundled()).unwrap());
        assert_eq!(languages(&conn).unwrap().len(), 1);
    }

    #[test]
    fn rejects_unsafe_catalogs() {
        let mut bad = bundled();
        bad.runtimes[0].id = "..".into();
        assert!(validate(&bad).is_err());

        let mut bad = bundled();
        bad.runtimes[0].exe.linux = "../../bin/sh".into();
        assert!(validate(&bad).is_err());

        let mut bad = bundled();
        bad.languages[0].extension = "py/../x".into();
        assert!(validate(&bad).is_err());

        let mut bad = bundled();
        bad.languages[2].compile.as_mut().unwrap().files.insert("../evil.h".into(), String::new());
        assert!(validate(&bad).is_err());

        let mut bad = bundled();
        bad.runtimes[0].downloads[0].url = "http://example.com/x.tar.gz".into();
        assert!(validate(&bad).is_err());
    }

    #[test]
    fn expands_placeholders() {
        let vars = Vars::default().set("source", "/w/a.c").set("binary", "/b/a");
        assert_eq!(vars.expand("-o {binary} {source}"), "-o /b/a /w/a.c");
        assert_eq!(vars.expand("{unknown} {source"), "{unknown} {source");
        // A value containing a placeholder is not expanded again.
        let vars = Vars::default().set("a", "{b}").set("b", "x");
        assert_eq!(vars.expand("{a}{b}"), "{b}x");
    }
}
