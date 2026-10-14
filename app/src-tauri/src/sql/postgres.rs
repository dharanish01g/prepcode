//! PostgreSQL: talking to its server with the tokio-postgres driver, and
//! splitting a file like `psql`, including its `\c` to switch databases (a
//! session belongs to one database; there's no `USE`) and a few of its other
//! backslash commands.

use std::path::Path;
use std::process::Stdio;
use std::time::Instant;

use futures_util::{pin_mut, StreamExt};
use tokio::sync::mpsc;
use tokio_postgres::error::{DbError, ErrorPosition, SqlState};
use tokio_postgres::{AsyncMessage, CancelToken, Client, NoTls, SimpleQueryMessage};

use super::{command_name, statement, Failure, Outcome, Statement, StatementResult, MAX_ROWS};

/// The superuser `initdb --username=postgres` creates, with no password.
const USER: &str = "postgres";
/// The database every session starts in, as psql's does.
const FIRST_DATABASE: &str = "postgres";

/// `psql`'s `\l`.
const LIST_DATABASES: &str = "SELECT datname AS \"Name\",
       pg_catalog.pg_get_userbyid(datdba) AS \"Owner\",
       pg_catalog.pg_encoding_to_char(encoding) AS \"Encoding\"
FROM pg_catalog.pg_database ORDER BY 1";
/// `psql`'s `\dt` and `\d`: the tables (and views) in the schemas in use.
const LIST_TABLES: &str = "SELECT table_schema AS \"Schema\", table_name AS \"Name\",
       CASE table_type WHEN 'BASE TABLE' THEN 'table' ELSE lower(table_type) END AS \"Type\"
FROM information_schema.tables
WHERE table_schema = ANY (current_schemas(false)) ORDER BY 1, 2";

pub struct Session {
    port: u16,
    /// The database it's connected to; `\c` changes it.
    database: String,
    /// None after the connection broke, until it's reopened.
    client: Option<Client>,
    /// What the server said on the side, like a function's RAISE NOTICE.
    notices: mpsc::UnboundedReceiver<DbError>,
}

/// Connects to `database`, as the superuser.
async fn open(
    port: u16,
    database: &str,
) -> Result<(Client, mpsc::UnboundedReceiver<DbError>), tokio_postgres::Error> {
    let (client, mut connection) = tokio_postgres::Config::new()
        .host("127.0.0.1")
        .port(port)
        .user(USER)
        .dbname(database)
        .application_name("prepcode")
        .connect(NoTls)
        .await?;
    let (sender, notices) = mpsc::unbounded_channel();
    // The connection does the talking until the client is dropped or the
    // server goes, handing out notices as they come.
    tokio::spawn(async move {
        let mut messages = futures_util::stream::poll_fn(move |cx| connection.poll_message(cx));
        while let Some(Ok(message)) = messages.next().await {
            if let AsyncMessage::Notice(notice) = message {
                let _ = sender.send(notice);
            }
        }
    });
    Ok((client, notices))
}

impl Session {
    pub async fn connect(port: u16) -> Result<Session, String> {
        let (client, notices) = open(port, FIRST_DATABASE).await.map_err(|e| e.to_string())?;
        Ok(Session { port, database: FIRST_DATABASE.into(), client: Some(client), notices })
    }

    pub async fn reconnect(&mut self) -> Result<(), String> {
        if self.client.as_ref().is_some_and(|client| !client.is_closed()) {
            return Ok(());
        }
        let (client, notices) =
            open(self.port, &self.database).await.map_err(|e| format!("Could not connect: {e}"))?;
        (self.client, self.notices) = (Some(client), notices);
        Ok(())
    }

    pub fn cancel(&self) -> Option<CancelToken> {
        self.client.as_ref().map(Client::cancel_token)
    }

    pub fn database(&self) -> Option<String> {
        Some(self.database.clone())
    }

    pub async fn run(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        match statement.sql.strip_prefix('\\') {
            Some(command) => self.backslash(statement, command, results).await,
            None => self.query(statement, results).await,
        }
    }

    pub async fn list_tables(&mut self) -> Result<Option<Vec<String>>, String> {
        let client = self.client.as_ref().ok_or("Not connected.")?;
        let sql = "SELECT table_name::text FROM information_schema.tables
                   WHERE table_schema = ANY (current_schemas(false)) ORDER BY 1";
        let rows = client.query(sql, &[]).await.map_err(|e| format!("Could not list the tables: {e}"))?;
        Ok(Some(rows.iter().map(|row| row.get(0)).collect()))
    }

    /// Runs SQL, adding a result for each statement in it.
    async fn query(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        let started = Instant::now();
        let client = self.client.as_ref().ok_or_else(|| Failure::Lost("Not connected.".into()))?;
        let parts = match collect(client, &statement.sql).await {
            Ok(parts) => parts,
            Err(e) => return Err(self.failure(e, statement)),
        };
        let seconds = started.elapsed().as_secs_f64();
        let (warnings, info) = self.take_notices();
        let sql = statement.sql.lines().next().unwrap_or_default().to_owned();
        for part in parts {
            let outcome = match part {
                Part::Rows { columns, rows, total } => {
                    Outcome::Table { name: self.table_name(&statement.sql).await, columns, rows, total }
                }
                Part::Done(affected) => {
                    Outcome::Status { affected, warnings, info: info.clone(), database_changed: false }
                }
            };
            results.push(StatementResult { line: statement.line, sql: sql.clone(), seconds, outcome });
        }
        Ok(())
    }

    /// A failed statement: stopped, rejected, or the connection broke.
    fn failure(&mut self, e: tokio_postgres::Error, statement: &Statement) -> Failure {
        match e.as_db_error() {
            Some(db) if *db.code() == SqlState::QUERY_CANCELED => Failure::Stopped,
            Some(db) => Failure::Error { line: error_line(statement, db), message: error_text(db) },
            None => {
                self.client = None;
                Failure::Lost(e.to_string())
            }
        }
    }

    /// The notices since the last statement: how many were warnings, and all
    /// of them as `psql` prints them.
    fn take_notices(&mut self) -> (u16, String) {
        let mut warnings = 0;
        let mut lines = Vec::new();
        while let Ok(notice) = self.notices.try_recv() {
            if notice.severity() == "WARNING" {
                warnings += 1;
            }
            lines.push(format!("{}:  {}", notice.severity(), notice.message()));
        }
        (warnings, lines.join("\n"))
    }

    /// The tables a statement's rows come from, or the command for SHOW and
    /// the like (see `Outcome::Table`). Only queries are looked at, by
    /// preparing (not running) them again: preparing a statement that fails
    /// would spoil a transaction the student has open.
    async fn table_name(&self, sql: &str) -> Option<String> {
        if let Some(command) = command_name(sql) {
            return Some(command);
        }
        let first = sql.split_whitespace().next()?;
        let queries = ["select", "with", "table", "values", "insert", "update", "delete", "merge"];
        if !queries.iter().any(|q| first.eq_ignore_ascii_case(q)) {
            return None;
        }
        let client = self.client.as_ref()?;
        let prepared = client.prepare(sql).await.ok()?;
        let mut oids: Vec<u32> = Vec::new();
        for oid in prepared.columns().iter().filter_map(|column| column.table_oid()) {
            if !oids.contains(&oid) {
                oids.push(oid);
            }
        }
        if oids.is_empty() {
            return None;
        }
        let rows = client
            .query("SELECT oid, relname::text FROM pg_class WHERE oid = ANY ($1)", &[&oids])
            .await
            .ok()?;
        let name = |oid: &u32| rows.iter().find(|row| row.get::<_, u32>(0) == *oid).map(|row| row.get(1));
        let names: Vec<String> = oids.iter().filter_map(name).collect();
        (!names.is_empty()).then(|| names.join(", "))
    }

    /// A `psql` backslash command. `\c` switches databases; `\l`, `\dt` and
    /// `\d` run what psql would, with its titles for their tabs.
    async fn backslash(
        &mut self,
        statement: &Statement,
        command: &str,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        let mut words = command.split_whitespace();
        let name = words.next().unwrap_or_default();
        let argument = words.next().map(|word| word.trim_end_matches(';'));
        let error = |message: String| Failure::Error { line: statement.line, message };
        let (sql, title) = match (name, argument) {
            ("c" | "connect", Some(database)) => {
                return self.switch(statement, database.trim_matches('"'), results).await;
            }
            ("c" | "connect", None) => return Err(error(r"\c needs a database, e.g. \c school".into())),
            ("l" | "list", _) => (LIST_DATABASES.to_owned(), "List of databases".to_owned()),
            ("dt", _) | ("d", None) => (LIST_TABLES.to_owned(), "List of relations".to_owned()),
            ("d", Some(table)) => {
                // Like a name in SQL: lowercase unless quoted.
                let table = match table.strip_prefix('"').and_then(|t| t.strip_suffix('"')) {
                    Some(quoted) => quoted.to_owned(),
                    None => table.to_lowercase(),
                };
                (describe(&table), format!("Table \"{table}\""))
            }
            _ => return Err(error(format!(r"Invalid command \{name}. Only \c, \l, \dt and \d work here."))),
        };

        let before = results.len();
        self.query(&Statement { line: statement.line, sql }, results).await?;
        if let (Some(table), "d") = (argument, name) {
            if results[before..].iter().any(|r| matches!(r.outcome, Outcome::Table { total: 0, .. })) {
                results.truncate(before);
                return Err(error(format!("Did not find any relation named \"{table}\".")));
            }
        }
        for result in &mut results[before..] {
            result.sql = statement.sql.clone();
            if let Outcome::Table { name: tab, .. } = &mut result.outcome {
                *tab = Some(title.clone());
            }
        }
        Ok(())
    }

    /// `\c database`: connects to it instead. Like psql, the old connection
    /// stays if the new one fails.
    async fn switch(
        &mut self,
        statement: &Statement,
        database: &str,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        let started = Instant::now();
        let (client, notices) = open(self.port, database).await.map_err(|e| Failure::Error {
            line: statement.line,
            message: e.as_db_error().map(error_text).unwrap_or_else(|| e.to_string()),
        })?;
        (self.client, self.notices, self.database) = (Some(client), notices, database.to_owned());
        let info = format!("You are now connected to database \"{database}\" as user \"{USER}\".");
        results.push(StatementResult {
            line: statement.line,
            sql: statement.sql.clone(),
            seconds: started.elapsed().as_secs_f64(),
            outcome: Outcome::Status { affected: 0, warnings: 0, info, database_changed: true },
        });
        Ok(())
    }
}

/// What one statement returned.
enum Part {
    Rows {
        columns: Vec<String>,
        rows: Vec<Vec<Option<String>>>,
        total: usize,
    },
    /// No rows: how many it changed.
    Done(u64),
}

/// Runs SQL as text, like psql: every value comes back as psql shows it.
async fn collect(client: &Client, sql: &str) -> Result<Vec<Part>, tokio_postgres::Error> {
    let stream = client.simple_query_raw(sql).await?;
    pin_mut!(stream);
    let mut parts = Vec::new();
    // The rows so far, once the statement has said it returns some.
    let mut table: Option<Part> = None;
    while let Some(message) = stream.next().await {
        match message? {
            SimpleQueryMessage::RowDescription(columns) => {
                let columns = columns.iter().map(|column| column.name().to_owned()).collect();
                table = Some(Part::Rows { columns, rows: Vec::new(), total: 0 });
            }
            SimpleQueryMessage::Row(row) => {
                if let Some(Part::Rows { rows, total, .. }) = table.as_mut() {
                    *total += 1;
                    if rows.len() < MAX_ROWS {
                        rows.push((0..row.len()).map(|i| row.get(i).map(str::to_owned)).collect());
                    }
                }
            }
            SimpleQueryMessage::CommandComplete(count) => {
                parts.push(table.take().unwrap_or(Part::Done(count)));
            }
            _ => {}
        }
    }
    Ok(parts)
}

/// An error as psql prints it, e.g. `ERROR:  relation "t" does not exist`.
fn error_text(db: &DbError) -> String {
    let mut text = format!("{}:  {}", db.severity(), db.message());
    if let Some(detail) = db.detail() {
        text.push_str(&format!("\nDETAIL:  {detail}"));
    }
    if let Some(hint) = db.hint() {
        text.push_str(&format!("\nHINT:  {hint}"));
    }
    text
}

/// The line the error points to, when the server says where in the
/// statement it is; otherwise the statement's first line.
fn error_line(statement: &Statement, db: &DbError) -> usize {
    match db.position() {
        // 1-based, in characters.
        Some(ErrorPosition::Original(position)) => {
            let before = statement.sql.chars().take((*position as usize).saturating_sub(1));
            statement.line + before.filter(|&c| c == '\n').count()
        }
        _ => statement.line,
    }
}

/// `psql`'s `\d table`: its columns.
fn describe(table: &str) -> String {
    format!(
        "SELECT column_name AS \"Column\", data_type AS \"Type\",
       CASE is_nullable WHEN 'NO' THEN 'not null' ELSE '' END AS \"Nullable\",
       column_default AS \"Default\"
FROM information_schema.columns
WHERE table_schema = ANY (current_schemas(false)) AND table_name = '{}'
ORDER BY ordinal_position",
        table.replace('\'', "''")
    )
}

/// `SELECT * FROM` the table, quoted.
pub fn select_all(table: &str) -> String {
    format!("SELECT * FROM \"{}\"", table.replace('"', "\"\""))
}

/// Asks the server on `data` to shut down. There's no SQL for it, so it's
/// `pg_ctl stop`, which works on Windows too. Fast mode ends open sessions
/// instead of waiting for them; the caller waits for the server to exit.
pub async fn shutdown(exe: &Path, data: &Path) {
    let mut command = tokio::process::Command::new(exe.with_file_name("pg_ctl"));
    command.arg("stop").arg("-D").arg(data).args(["-m", "fast", "--no-wait"]);
    command.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(windows)]
    command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    let _ = command.status().await;
}

// --- Splitting a file into statements -------------------------------------------

enum Scan {
    Code,
    /// In '…' or "…". E'…' strings also have backslash escapes.
    Quote {
        quote: char,
        backslash: bool,
    },
    /// In a $$…$$ or $tag$…$tag$ string, as function bodies are written; this
    /// is the closing tag.
    Dollar(Vec<char>),
    LineComment,
    /// /* … */ comments nest; how deep.
    BlockComment(usize),
}

fn is_identifier_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_' || c == '$'
}

/// Splits a file into statements like `psql` does: at `;`, but not inside
/// quotes, $$ strings (function bodies) or comments. A backslash command,
/// like `\c school`, is the rest of its line. Comment-only parts are dropped.
pub fn split_statements(text: &str) -> Vec<Statement> {
    let chars: Vec<char> = text.chars().collect();
    let mut statements = Vec::new();
    // From the statement's first code (not a comment or space).
    let mut start: Option<usize> = None;
    let mut state = Scan::Code;
    let mut i = 0;

    while i < chars.len() {
        let c = chars[i];
        let next = chars.get(i + 1).copied();
        match &mut state {
            Scan::Quote { quote, backslash } => {
                if *backslash && c == '\\' {
                    i += 1; // skip the escaped character
                } else if c == *quote {
                    state = Scan::Code;
                }
            }
            Scan::Dollar(tag) => {
                if chars[i..].starts_with(tag) {
                    i += tag.len();
                    state = Scan::Code;
                    continue;
                }
            }
            Scan::LineComment => {
                if c == '\n' {
                    state = Scan::Code;
                }
            }
            Scan::BlockComment(depth) => {
                if c == '*' && next == Some('/') {
                    i += 1;
                    *depth -= 1;
                    if *depth == 0 {
                        state = Scan::Code;
                    }
                } else if c == '/' && next == Some('*') {
                    i += 1;
                    *depth += 1;
                }
            }
            Scan::Code => {
                if start.is_none() && c == '\\' {
                    let end = chars[i..].iter().position(|&c| c == '\n').map_or(chars.len(), |p| i + p);
                    statements.push(statement(&chars, i, end));
                    i = end;
                    continue;
                }
                if c == ';' {
                    if let Some(start) = start.take() {
                        statements.push(statement(&chars, start, i));
                    }
                } else if c == '-' && next == Some('-') {
                    state = Scan::LineComment;
                    i += 1;
                } else if c == '/' && next == Some('*') {
                    state = Scan::BlockComment(1);
                    i += 1;
                } else {
                    if start.is_none() && !c.is_whitespace() {
                        start = Some(i);
                    }
                    let after_word = i > 0 && is_identifier_char(chars[i - 1]);
                    match c {
                        '\'' => {
                            // E'…', where the E isn't the end of a longer word.
                            let escape = after_word
                                && matches!(chars[i - 1], 'E' | 'e')
                                && (i < 2 || !is_identifier_char(chars[i - 2]));
                            state = Scan::Quote { quote: '\'', backslash: escape };
                        }
                        '"' => state = Scan::Quote { quote: '"', backslash: false },
                        '$' if !after_word => {
                            if let Some(tag) = dollar_tag(&chars, i) {
                                i += tag.len();
                                state = Scan::Dollar(tag);
                                continue;
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
        i += 1;
    }
    if let Some(start) = start {
        statements.push(statement(&chars, start, chars.len()));
    }
    statements
}

/// The `$$` or `$tag$` starting at `i`, if it is one (not a `$1` parameter).
fn dollar_tag(chars: &[char], i: usize) -> Option<Vec<char>> {
    let mut j = i + 1;
    while let Some(&c) = chars.get(j) {
        if c == '$' {
            return Some(chars[i..=j].to_vec());
        }
        let valid = if j == i + 1 { c.is_alphabetic() || c == '_' } else { c.is_alphanumeric() || c == '_' };
        if !valid {
            return None;
        }
        j += 1;
    }
    None
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::super::{launch, run_file, Server, Servers};
    use super::*;
    use crate::catalog::{self, Engine, Vars};
    use crate::databases::tests::set_up_in;
    use crate::runtimes::tests::install_for_this_platform;

    const SAMPLE: &str = r"CREATE DATABASE school;
\c school
CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(20), photo BYTEA);
INSERT INTO students VALUES (1, 'Asha', NULL), (2, 'Ravi', '\xCAFE');
SELECT * FROM students ORDER BY id;
CREATE FUNCTION greet(who TEXT) RETURNS TEXT AS $$
BEGIN
  RAISE NOTICE 'greeting %;', who;
  RETURN 'hi ' || who;
END;
$$ LANGUAGE plpgsql;
DO $$ BEGIN PERFORM greet('Asha'); END $$;
SELECT greet('Ravi'), COUNT(*) FROM students;
\dt
SELECT * FROM teachers;
SELECT 'never runs';";

    /// Real install, setup and server, then files through run_file.
    /// Run with: cargo test -- --ignored
    #[test]
    #[ignore = "downloads ~12-50 MB"]
    fn runs_a_file_on_postgres() {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let language = catalog.languages.iter().find(|l| l.extension == "pgsql.sql").unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id == language.runtime).unwrap();
        install_for_this_platform(&runtime.id, |root| {
            let exe = root.join(runtime.executable());
            let data = root.parent().unwrap().join("d").join("pgsql");
            set_up_in(&data, language, runtime, &exe, Vars::default().set("runtime", root)).unwrap();
            assert!(data.join("PG_VERSION").is_file());

            tauri::async_runtime::block_on(async {
                let vars = Vars::default().set("runtime", root);
                let (process, mut session) =
                    launch(language, runtime, Engine::Postgres, &exe, &data, vars).await.unwrap();
                let servers = Servers::default();
                let output = run_file(&mut session, &split_statements(SAMPLE), &servers, "PostgreSQL").await;

                let json = serde_json::to_value(&output).unwrap();
                let results = json["results"].as_array().unwrap();
                let kinds: Vec<_> = results.iter().map(|r| r["kind"].as_str().unwrap()).collect();
                assert_eq!(
                    kinds,
                    ["status", "status", "status", "status", "table", "status", "status", "table", "table"],
                    "{json}"
                );
                assert_eq!(results[0]["sql"], "CREATE DATABASE school");
                assert_eq!(results[1]["sql"], r"\c school");
                assert_eq!(results[1]["databaseChanged"], true);
                assert_eq!(results[3]["affected"], 2);
                assert_eq!(results[4]["line"], 5);
                assert_eq!(results[4]["name"], "students");
                assert_eq!(results[4]["columns"], serde_json::json!(["id", "name", "photo"]));
                assert_eq!(
                    results[4]["rows"],
                    serde_json::json!([["1", "Asha", null], ["2", "Ravi", r"\xcafe"]])
                );
                assert_eq!(results[5]["line"], 6);
                assert_eq!(results[6]["info"], "NOTICE:  greeting Asha;");
                assert_eq!(results[7]["name"], serde_json::Value::Null);
                assert_eq!(results[7]["rows"], serde_json::json!([["hi Ravi", "2"]]));
                assert_eq!(results[8]["name"], "List of relations");
                assert_eq!(results[8]["rows"][0][1], "students");
                assert_eq!(json["database"], "school");
                assert_eq!(json["error"]["line"], 15);
                assert_eq!(json["error"]["message"], "ERROR:  relation \"teachers\" does not exist");

                // Errors point at their line, not just the statement's first.
                let output = run_file(
                    &mut session,
                    &split_statements("SELECT id,\n  nope\nFROM students;"),
                    &servers,
                    "PostgreSQL",
                )
                .await;
                assert_eq!(output.error.as_ref().map(|e| e.line), Some(2));

                // What list_tables, table_rows and \d run on the same session.
                assert_eq!(session.list_tables().await.unwrap(), Some(vec!["students".to_owned()]));
                let rows = serde_json::to_value(session.table_rows("students").await.unwrap()).unwrap();
                assert_eq!((rows["name"].clone(), rows["total"].clone()), ("students".into(), 2.into()));
                let describe = run_file(&mut session, &split_statements(r"\d Students"), &servers, "").await;
                let describe = serde_json::to_value(&describe).unwrap();
                assert_eq!(describe["results"][0]["name"], "Table \"students\"");
                assert_eq!(
                    describe["results"][0]["rows"][1],
                    serde_json::json!(["name", "character varying", "", null])
                );
                let missing = run_file(&mut session, &split_statements(r"\d nope"), &servers, "").await;
                assert_eq!(missing.error.unwrap().message, "Did not find any relation named \"nope\".");
                let bad = run_file(&mut session, &split_statements(r"\c nowhere"), &servers, "").await;
                assert_eq!(bad.error.unwrap().message, "FATAL:  database \"nowhere\" does not exist");
                assert_eq!(bad.database.as_deref(), Some("school"));

                // Stop interrupts a long statement.
                let sleep = split_statements("SELECT pg_sleep(30); SELECT 'skipped';");
                let (output, stopped) = tokio::join!(run_file(&mut session, &sleep, &servers, ""), async {
                    tokio::time::sleep(Duration::from_millis(500)).await;
                    servers.interrupt().await
                });
                stopped.unwrap();
                assert!(output.stopped && output.results.is_empty() && output.error.is_none());

                let (account, extension) = (String::new(), String::new());
                Server { account, extension, process, session, exe, data: data.clone() }.stop().await;
                assert!(!data.join("postmaster.pid").exists(), "didn't shut down cleanly");
            });
        });
    }

    fn split(text: &str) -> Vec<(usize, String)> {
        split_statements(text).into_iter().map(|s| (s.line, s.sql)).collect()
    }

    fn expected(statements: &[(usize, &str)]) -> Vec<(usize, String)> {
        statements.iter().map(|&(line, sql)| (line, sql.to_owned())).collect()
    }

    #[test]
    fn splits_at_semicolons() {
        assert_eq!(split("select 1; select 2;"), expected(&[(1, "select 1"), (1, "select 2")]));
        assert_eq!(split("select 1;\n\nselect\n  2"), expected(&[(1, "select 1"), (3, "select\n  2")]));
        assert!(split("").is_empty());
        assert!(split(" ;; \n").is_empty());
    }

    #[test]
    fn ignores_semicolons_in_quotes() {
        assert_eq!(
            split("insert into t values ('a;b', 'it''s;'); select \"x;y\" from t;"),
            expected(&[(1, "insert into t values ('a;b', 'it''s;')"), (1, "select \"x;y\" from t")])
        );
        // A backslash is just a character, except in E'…' strings.
        assert_eq!(split(r"select 'C:\'; select 2;"), expected(&[(1, r"select 'C:\'"), (1, "select 2")]));
        assert_eq!(
            split(r"select E'it\'s;'; select 2;"),
            expected(&[(1, r"select E'it\'s;'"), (1, "select 2")])
        );
        assert_eq!(split(r"select name'\'; select 2;"), expected(&[(1, r"select name'\'"), (1, "select 2")]));
    }

    #[test]
    fn keeps_function_bodies_whole() {
        let text = "CREATE FUNCTION f() RETURNS int AS $$\nBEGIN\n  RETURN 1;\nEND;\n$$ LANGUAGE plpgsql;\nSELECT f();";
        assert_eq!(
            split(text),
            expected(&[
                (1, "CREATE FUNCTION f() RETURNS int AS $$\nBEGIN\n  RETURN 1;\nEND;\n$$ LANGUAGE plpgsql"),
                (6, "SELECT f()")
            ])
        );
        let tagged = "DO $body$ BEGIN RAISE NOTICE '$$;'; END $body$; SELECT $1, a$b;";
        assert_eq!(
            split(tagged),
            expected(&[(1, "DO $body$ BEGIN RAISE NOTICE '$$;'; END $body$"), (1, "SELECT $1, a$b")])
        );
    }

    #[test]
    fn ignores_comments() {
        assert_eq!(
            split(
                "-- intro; still a comment\nselect 1;--done;\n/* ; /* nested; */ ; */ select 2;\n-- the end"
            ),
            expected(&[(2, "select 1"), (3, "select 2")])
        );
        // # is an operator, not a comment.
        assert_eq!(split("select 5 # 1;"), expected(&[(1, "select 5 # 1")]));
    }

    #[test]
    fn backslash_commands_end_at_the_line() {
        assert_eq!(
            split("\\c school\n\\dt\nSELECT 1;\n  \\d students"),
            expected(&[(1, "\\c school"), (2, "\\dt"), (3, "SELECT 1"), (4, "\\d students")])
        );
    }
}
