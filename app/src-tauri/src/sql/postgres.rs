//! PostgreSQL: talking to its server with the tokio-postgres driver, and
//! splitting a file like `psql`, including its `\c` to switch databases (a
//! session belongs to one database; there's no `USE`) and a few of its other
//! backslash commands.

use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use futures_util::{pin_mut, SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_postgres::error::{DbError, ErrorPosition, SqlState};
use tokio_postgres::{AsyncMessage, CancelToken, Client, NoTls, SimpleQueryMessage};

use super::{command_name, statement, Failure, Outcome, Statement, StatementResult, MAX_ROWS};

/// The superuser `initdb --username=postgres` creates, with the password the
/// account's setup made (see databases.rs).
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
    /// None for a database set up before it had one (it then needs none).
    password: Option<String>,
    /// The database it's connected to; `\c` changes it.
    database: String,
    /// None after the connection broke, until it's reopened.
    client: Option<Client>,
    /// What the server said on the side, like a function's RAISE NOTICE.
    notices: mpsc::UnboundedReceiver<DbError>,
    gate: Arc<Gate>,
}

/// Keeps Stop from cancelling the statement prepcode runs after a student's
/// one to name its tables (see `table_name`): cancelled inside a transaction
/// the student has open, it would quietly spoil it.
#[derive(Default)]
struct Gate {
    /// Stop was pressed during this statement.
    stopping: AtomicBool,
    /// Held while naming tables.
    naming: tokio::sync::Mutex<()>,
}

/// How to interrupt the statement a session is running.
#[derive(Clone)]
pub struct Cancel {
    token: CancelToken,
    gate: Arc<Gate>,
}

impl Cancel {
    pub async fn cancel(self) -> Result<(), String> {
        self.gate.stopping.store(true, Ordering::Relaxed);
        // The student's statement already finished, and only the naming runs:
        // let it, and the rest of the file is skipped anyway. Held while the
        // cancel goes out, so naming waits, then sees `stopping` and skips.
        let Ok(_naming) = self.gate.naming.try_lock() else { return Ok(()) };
        self.token.cancel_query(NoTls).await.map_err(|e| e.to_string())
    }
}

/// Connects to `database`, as the superuser.
async fn open(
    port: u16,
    password: Option<&str>,
    database: &str,
) -> Result<(Client, mpsc::UnboundedReceiver<DbError>), tokio_postgres::Error> {
    let mut config = tokio_postgres::Config::new();
    config.host("127.0.0.1").port(port).user(USER).dbname(database).application_name("prepcode");
    if let Some(password) = password {
        config.password(password);
    }
    let (client, mut connection) = config.connect(NoTls).await?;
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
    pub async fn connect(port: u16, password: Option<String>) -> Result<Session, String> {
        let (client, notices) =
            open(port, password.as_deref(), FIRST_DATABASE).await.map_err(|e| e.to_string())?;
        Ok(Session {
            port,
            password,
            database: FIRST_DATABASE.into(),
            client: Some(client),
            notices,
            gate: Arc::default(),
        })
    }

    /// A session of its own in `database`, made if it isn't there yet, for
    /// SQL practice: a check never changes what the shared session uses.
    pub async fn open_practice(&self, database: &str) -> Result<Session, String> {
        let password = self.password.as_deref();
        let could_not = |e: tokio_postgres::Error| format!("Could not set up practice: {e}");
        let (client, _) = open(self.port, password, FIRST_DATABASE).await.map_err(could_not)?;
        let exists = client
            .query_opt("SELECT 1 FROM pg_database WHERE datname = $1", &[&database])
            .await
            .map_err(could_not)?
            .is_some();
        if !exists {
            let sql = format!("CREATE DATABASE \"{}\"", database.replace('"', "\"\""));
            client.batch_execute(&sql).await.map_err(could_not)?;
        }
        drop(client);
        let (client, notices) = open(self.port, password, database).await.map_err(could_not)?;
        Ok(Session {
            port: self.port,
            password: self.password.clone(),
            database: database.into(),
            client: Some(client),
            notices,
            gate: Arc::default(),
        })
    }

    pub async fn reconnect(&mut self) -> Result<(), String> {
        if self.client.as_ref().is_some_and(|client| !client.is_closed()) {
            return Ok(());
        }
        let (client, notices) = open(self.port, self.password.as_deref(), &self.database)
            .await
            .map_err(|e| format!("Could not connect: {e}"))?;
        (self.client, self.notices) = (Some(client), notices);
        Ok(())
    }

    pub fn cancel(&self) -> Option<Cancel> {
        let token = self.client.as_ref()?.cancel_token();
        Some(Cancel { token, gate: self.gate.clone() })
    }

    pub fn database(&self) -> Option<String> {
        Some(self.database.clone())
    }

    pub async fn run(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        self.gate.stopping.store(false, Ordering::Relaxed);
        if let Some(command) = statement.sql.strip_prefix('\\') {
            return self.backslash(statement, command, results).await;
        }
        match copy_direction(&statement.sql) {
            Some(Copy::In) => self.copy_in(statement, results).await,
            Some(Copy::Out) => Err(Failure::Error {
                line: statement.line,
                message: "COPY … TO STDOUT can't show its rows here. Use SELECT to see them.".into(),
            }),
            None => self.query(statement, results, None).await,
        }
    }

    /// The tables in the schemas in use. Those outside the first one, like
    /// `public` when there's a `postgres` schema too, are `schema.table`.
    pub async fn list_tables(&mut self) -> Result<Option<Vec<String>>, String> {
        let client = self.client.as_ref().ok_or("Not connected.")?;
        let sql = "SELECT CASE WHEN table_schema = current_schema() THEN table_name
                               ELSE table_schema || '.' || table_name END::text
                   FROM information_schema.tables
                   WHERE table_schema = ANY (current_schemas(false))
                   ORDER BY table_schema <> current_schema(), 1";
        let rows = client.query(sql, &[]).await.map_err(|e| format!("Could not list the tables: {e}"))?;
        Ok(Some(rows.iter().map(|row| row.get(0)).collect()))
    }

    /// All of a table's rows (up to MAX_ROWS shown), for its sub-tab in Tables.
    pub async fn table_rows(&mut self, table: &str) -> Result<StatementResult, String> {
        let mut results = Vec::new();
        let statement = Statement::new(0, select_all(table));
        match self.query(&statement, &mut results, Some(table.to_owned())).await {
            Ok(()) => results.into_iter().next().ok_or_else(|| format!("{table} returned nothing.")),
            Err(Failure::Error { message, .. }) => Err(message),
            Err(Failure::Lost(e)) => Err(format!("Could not read {table}: {e}")),
            Err(Failure::Stopped) => Err("Stopped.".into()),
        }
    }

    /// Runs SQL, adding a result for each statement in it. Rows are named
    /// `name`, or by looking up the tables they come from.
    async fn query(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
        name: Option<String>,
    ) -> Result<(), Failure> {
        let started = Instant::now();
        let client = self.client.as_ref().ok_or_else(|| Failure::Lost("Not connected.".into()))?;
        let parts = match collect(client, &statement.sql).await {
            Ok(parts) => parts,
            Err(e) => return Err(self.failure(e, statement)),
        };
        let seconds = started.elapsed().as_secs_f64();
        // Shown once, with the statement's first result.
        let (mut warnings, mut info) = self.take_notices();
        let sql = statement.sql.lines().next().unwrap_or_default().to_owned();
        for part in parts {
            let outcome = match part {
                Part::Rows { columns, rows, total } => {
                    let name = match &name {
                        Some(name) => Some(name.clone()),
                        None => self.table_name(&statement.sql).await,
                    };
                    Outcome::Table { name, columns, rows, total, info: std::mem::take(&mut info) }
                }
                Part::Done(affected) => Outcome::Status {
                    affected,
                    warnings: std::mem::take(&mut warnings),
                    info: std::mem::take(&mut info),
                    database_changed: false,
                },
            };
            results.push(StatementResult { line: statement.line, sql: sql.clone(), seconds, outcome });
        }
        Ok(())
    }

    /// `COPY … FROM STDIN`, with the data lines that follow it in the file.
    async fn copy_in(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        let started = Instant::now();
        let client = self.client.as_ref().ok_or_else(|| Failure::Lost("Not connected.".into()))?;
        let data = bytes::Bytes::from(statement.copy_data.clone().unwrap_or_default());
        let copied = async {
            let sink = client.copy_in(statement.sql.as_str()).await?;
            pin_mut!(sink);
            sink.send(data).await?;
            sink.finish().await
        }
        .await;
        let affected = match copied {
            Ok(rows) => rows,
            Err(e) => return Err(self.failure(e, statement)),
        };
        let (warnings, info) = self.take_notices();
        results.push(StatementResult {
            line: statement.line,
            sql: statement.sql.lines().next().unwrap_or_default().to_owned(),
            seconds: started.elapsed().as_secs_f64(),
            outcome: Outcome::Status { affected, warnings, info, database_changed: false },
        });
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
    /// would spoil a transaction the student has open. So would Stop
    /// cancelling it, so it's skipped once Stop is pressed (see `Gate`).
    async fn table_name(&self, sql: &str) -> Option<String> {
        if let Some(command) = command_name(sql) {
            return Some(command);
        }
        let first = sql.split_whitespace().next()?;
        let queries = ["select", "with", "table", "values", "insert", "update", "delete", "merge"];
        if !queries.iter().any(|q| first.eq_ignore_ascii_case(q)) {
            return None;
        }
        let _naming = self.gate.naming.lock().await;
        if self.gate.stopping.load(Ordering::Relaxed) {
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
        let words = arguments(command);
        let name = words.first().map(String::as_str).unwrap_or_default();
        let argument = words.get(1).map(|word| word.trim_end_matches(';'));
        let error = |message: String| Failure::Error { line: statement.line, message };
        let (sql, title) = match (name, argument) {
            ("c" | "connect", Some(database)) => {
                return self.switch(statement, &unquote(database), results).await;
            }
            ("c" | "connect", None) => return Err(error(r"\c needs a database, e.g. \c school".into())),
            ("l" | "list", _) => (LIST_DATABASES.to_owned(), "List of databases".to_owned()),
            ("dt", _) | ("d", None) => (LIST_TABLES.to_owned(), "List of relations".to_owned()),
            ("d", Some(table)) => {
                let (schema, table) = relation(table);
                let shown = match &schema {
                    Some(schema) => format!("{schema}.{table}"),
                    None => table.clone(),
                };
                (describe(schema.as_deref(), &table), format!("Table \"{shown}\""))
            }
            _ => return Err(error(format!(r"Invalid command \{name}. Only \c, \l, \dt and \d work here."))),
        };

        let before = results.len();
        self.query(&Statement::new(statement.line, sql), results, Some(title)).await?;
        if let (Some(table), "d") = (argument, name) {
            if results[before..].iter().any(|r| matches!(r.outcome, Outcome::Table { total: 0, .. })) {
                results.truncate(before);
                return Err(error(format!("Did not find any relation named \"{table}\".")));
            }
        }
        for result in &mut results[before..] {
            result.sql = statement.sql.clone();
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
        let opened = open(self.port, self.password.as_deref(), database).await;
        let (client, notices) = opened.map_err(|e| Failure::Error {
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

/// `psql`'s `\d table`: its columns. In `schema`, or the schemas in use.
fn describe(schema: Option<&str>, table: &str) -> String {
    let literal = |text: &str| format!("'{}'", text.replace('\'', "''"));
    let schemas = match schema {
        Some(schema) => format!("table_schema = {}", literal(schema)),
        None => "table_schema = ANY (current_schemas(false))".to_owned(),
    };
    format!(
        "SELECT column_name AS \"Column\", data_type AS \"Type\",
       CASE is_nullable WHEN 'NO' THEN 'not null' ELSE '' END AS \"Nullable\",
       column_default AS \"Default\"
FROM information_schema.columns
WHERE {schemas} AND table_name = {}
ORDER BY ordinal_position",
        literal(table)
    )
}

/// `SELECT * FROM` a table from `list_tables`: `name`, or `schema.name`.
pub fn select_all(table: &str) -> String {
    let quote = |name: &str| format!("\"{}\"", name.replace('"', "\"\""));
    match table.split_once('.') {
        Some((schema, name)) => format!("SELECT * FROM {}.{}", quote(schema), quote(name)),
        None => format!("SELECT * FROM {}", quote(table)),
    }
}

/// A backslash command's words, like psql splits them: at spaces, except
/// inside "double quotes", which are kept.
fn arguments(command: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut word = String::new();
    let mut quoted = false;
    for c in command.chars() {
        if c == '"' {
            quoted = !quoted;
        }
        if c.is_whitespace() && !quoted {
            if !word.is_empty() {
                words.push(std::mem::take(&mut word));
            }
        } else {
            word.push(c);
        }
    }
    if !word.is_empty() {
        words.push(word);
    }
    words
}

/// A name with its double quotes taken off (`""` is a quote in one).
fn unquote(word: &str) -> String {
    match word.strip_prefix('"').and_then(|w| w.strip_suffix('"')) {
        Some(inner) => inner.replace("\"\"", "\""),
        None => word.to_owned(),
    }
}

/// `\d`'s `table` or `schema.table`, each part like a name in SQL: lowercase
/// unless quoted.
fn relation(word: &str) -> (Option<String>, String) {
    let mut parts = Vec::new();
    let (mut part, mut quoted) = (String::new(), false);
    for c in word.chars() {
        if c == '"' {
            quoted = !quoted;
        }
        if c == '.' && !quoted {
            parts.push(std::mem::take(&mut part));
        } else {
            part.push(c);
        }
    }
    parts.push(part);
    let name = |part: &String| match part.starts_with('"') {
        true => unquote(part),
        false => part.to_lowercase(),
    };
    match parts.as_slice() {
        [schema, table] => (Some(name(schema)), name(table)),
        _ => (None, name(&parts[parts.len() - 1])),
    }
}

/// Which way a COPY sends its data, when it's to or from prepcode.
#[derive(Debug, PartialEq)]
enum Copy {
    /// `COPY t FROM STDIN`: the lines after it in the file.
    In,
    /// `COPY … TO STDOUT`.
    Out,
}

fn copy_direction(sql: &str) -> Option<Copy> {
    let words: Vec<String> = sql
        .split(|c: char| c.is_whitespace() || c == '(' || c == ')')
        .filter(|word| !word.is_empty())
        .map(str::to_lowercase)
        .collect();
    if words.first().map(String::as_str) != Some("copy") {
        return None;
    }
    let follows = |a: &str, b: &str| words.windows(2).any(|pair| pair[0] == a && pair[1] == b);
    if follows("from", "stdin") {
        Some(Copy::In)
    } else if follows("to", "stdout") {
        Some(Copy::Out)
    } else {
        None
    }
}

/// The server's pid, from the file it writes in its data folder.
pub fn postmaster_pid(data: &Path) -> Option<u32> {
    let text = std::fs::read_to_string(data.join("postmaster.pid")).ok()?;
    text.lines().next()?.trim().parse().ok()
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
/// A `COPY … FROM STDIN` takes the lines after it, up to `\.`, as its data.
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
                        let mut copy = statement(&chars, start, i);
                        if copy_direction(&copy.sql) == Some(Copy::In) {
                            let (data, end) = copy_data(&chars, i + 1);
                            copy.copy_data = Some(data);
                            statements.push(copy);
                            i = end;
                            continue;
                        }
                        statements.push(copy);
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

/// The data of a `COPY … FROM STDIN` whose `;` is just before `from`: the
/// lines after that one, up to a `\.` line or the end. Also where to go on
/// from, after the `\.` line.
fn copy_data(chars: &[char], from: usize) -> (String, usize) {
    let line_end = |at: usize| chars[at..].iter().position(|&c| c == '\n').map_or(chars.len(), |p| at + p);
    // The data starts on the next line, like psql's.
    let start = (line_end(from) + 1).min(chars.len());
    let mut at = start;
    while at < chars.len() {
        let end = line_end(at);
        let line: String = chars[at..end].iter().collect();
        if line.trim_end() == r"\." {
            return (chars[start..at].iter().collect(), end);
        }
        at = end + 1;
    }
    (chars[start..].iter().collect(), chars.len())
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
            assert_eq!(crate::databases::password(&data).map(|p| p.len()), Some(32));

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
                // A notice from a statement with rows is kept too.
                assert_eq!(results[7]["info"], "NOTICE:  greeting Ravi;");
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
                let quoted = run_file(&mut session, &split_statements(r#"\c "school""#), &servers, "").await;
                assert!(quoted.error.is_none(), "{:?}", quoted.error.map(|e| e.message));
                let qualified =
                    run_file(&mut session, &split_statements(r"\d public.students"), &servers, "").await;
                let qualified = serde_json::to_value(&qualified).unwrap();
                assert_eq!(qualified["results"][0]["name"], "Table \"public.students\"");

                // COPY … FROM STDIN takes the lines after it; TO STDOUT says to
                // use SELECT, and the session carries on.
                let copy = "COPY students (id, name) FROM STDIN;\n3\tMeena\n4\tKiran\n\\.\nSELECT COUNT(*) FROM students;\nCOPY students TO STDOUT;";
                let copied = run_file(&mut session, &split_statements(copy), &servers, "").await;
                let copied_json = serde_json::to_value(&copied).unwrap();
                assert_eq!(copied_json["results"][0]["affected"], 2, "{copied_json}");
                assert_eq!(copied_json["results"][1]["rows"], serde_json::json!([["4"]]));
                assert!(copied.error.unwrap().message.contains("Use SELECT"));
                let after = run_file(&mut session, &split_statements("SELECT 1;"), &servers, "").await;
                assert!(after.error.is_none());

                // The server wants the account's password.
                let super::super::Session::Postgres(postgres) = &session else { unreachable!() };
                assert!(open(postgres.port, None, FIRST_DATABASE).await.is_err());
                assert!(open(postgres.port, Some("wrong"), FIRST_DATABASE).await.is_err());

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
    fn copy_from_stdin_takes_its_data() {
        let text = "COPY t FROM STDIN;\n1\ta;b\n2\tc\n\\.\nSELECT 1;";
        let statements = split_statements(text);
        assert_eq!(
            statements.iter().map(|s| (s.line, s.sql.as_str())).collect::<Vec<_>>(),
            [(1, "COPY t FROM STDIN"), (5, "SELECT 1")]
        );
        assert_eq!(statements[0].copy_data.as_deref(), Some("1\ta;b\n2\tc\n"));
        // No `\.`: the rest of the file.
        let open = split_statements("copy t (a) from stdin with (format csv);\n1\n2");
        assert_eq!(open[0].copy_data.as_deref(), Some("1\n2"));
        assert_eq!(open.len(), 1);
        // Other COPYs are statements like any.
        assert_eq!(split_statements("COPY t TO STDOUT; SELECT 1;")[0].copy_data, None);
    }

    #[test]
    fn tells_copy_directions() {
        assert_eq!(copy_direction("COPY t FROM STDIN"), Some(Copy::In));
        assert_eq!(copy_direction("copy t(a, b)  from\nstdin (format csv)"), Some(Copy::In));
        assert_eq!(copy_direction("COPY (SELECT 1) TO STDOUT"), Some(Copy::Out));
        assert_eq!(copy_direction("COPY t FROM '/tmp/x.csv'"), None);
        assert_eq!(copy_direction("SELECT 'copy from stdin'"), None);
    }

    #[test]
    fn reads_backslash_names() {
        assert_eq!(arguments(r#"c "my db""#), ["c", r#""my db""#]);
        assert_eq!(unquote(r#""my db""#), "my db");
        assert_eq!(unquote("School"), "School");
        assert_eq!(relation("Students"), (None, "students".into()));
        assert_eq!(relation(r#""Students""#), (None, "Students".into()));
        assert_eq!(relation("public.Students"), (Some("public".into()), "students".into()));
        assert_eq!(relation(r#"public."a.b""#), (Some("public".into()), "a.b".into()));
        assert_eq!(select_all("students"), r#"SELECT * FROM "students""#);
        assert_eq!(select_all("public.students"), r#"SELECT * FROM "public"."students""#);
    }

    #[test]
    fn backslash_commands_end_at_the_line() {
        assert_eq!(
            split("\\c school\n\\dt\nSELECT 1;\n  \\d students"),
            expected(&[(1, "\\c school"), (2, "\\dt"), (3, "SELECT 1"), (4, "\\d students")])
        );
    }
}
