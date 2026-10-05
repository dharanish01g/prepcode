//! Running a database file's queries on the signed-in account's own server.
//!
//! The server (MySQL so far) starts on the first Run and keeps running, with
//! one session every run shares, like the `mysql` shell: `USE school;` in one
//! run still applies in the next. It stops on logout and when the app exits.
//! The data stays in the account's folder (see databases.rs).
//!
//! Each statement's result comes back like the shell shows it: rows as a
//! table, or a status such as "Query OK, 1 row affected", and the error that
//! stopped the file, if any.

use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use mysql_async::consts::ColumnType;
use mysql_async::prelude::Queryable;
use mysql_async::{Column, Conn, Opts, OptsBuilder, Value};
use serde::Serialize;
use tauri::{AppHandle, State};
use tokio::process::{Child, Command};

use crate::auth::CurrentUser;
use crate::catalog::{self, Kind, Language, Runtime, Vars};
use crate::databases;
use crate::db::Db;
use crate::files::{resolve_file, split_extension};
use crate::runtimes::{executable_path, runtime_dir, shared_data_dir, step_command};

/// Rows sent to the screen per result; more would only freeze it.
const MAX_ROWS: usize = 1000;
/// How long a server may take to accept connections after starting.
const START_TIMEOUT: Duration = Duration::from_secs(60);
/// How long a server may take to shut down before it's killed.
const STOP_TIMEOUT: Duration = Duration::from_secs(15);
/// MySQL's error when KILL QUERY interrupts a statement.
const ER_QUERY_INTERRUPTED: u16 = 1317;
/// MySQL's error for a query that needs a database when none is selected.
const ER_NO_DB_ERROR: u16 = 1046;

#[derive(Default)]
pub struct Servers {
    /// Held for a whole run, so runs, starting and stopping take turns.
    server: tokio::sync::Mutex<Option<Server>>,
    /// While a run is in progress, how to reach its session, for Stop.
    running: Mutex<Option<(Opts, u32)>>,
    /// Stop was pressed: skip the rest of the file.
    stop: AtomicBool,
}

struct Server {
    account: String,
    extension: String,
    process: Child,
    opts: Opts,
    /// The session runs share; reopened if it breaks.
    session: Option<Conn>,
}

impl Servers {
    /// Stops the running server, if any: on logout and when the app exits.
    pub async fn stop(&self) {
        // A long query holds the lock; interrupt it first.
        let _ = self.interrupt().await;
        if let Some(server) = self.server.lock().await.take() {
            server.stop().await;
        }
    }

    /// Interrupts the statement running now and skips the rest of the file.
    async fn interrupt(&self) -> Result<(), String> {
        let running = self.running.lock().unwrap_or_else(|e| e.into_inner()).clone();
        let Some((opts, id)) = running else { return Ok(()) };
        self.stop.store(true, Ordering::Relaxed);
        let mut conn = Conn::new(opts).await.map_err(|e| format!("Could not stop: {e}"))?;
        let killed = conn.query_drop(format!("KILL QUERY {id}")).await;
        let _ = conn.disconnect().await;
        killed.map_err(|e| format!("Could not stop: {e}"))
    }
}

impl Server {
    /// The session, to hand back with `session = Some(conn)` when done.
    async fn take_session(&mut self) -> Result<Conn, String> {
        match self.session.take() {
            Some(conn) => Ok(conn),
            None => Conn::new(self.opts.clone()).await.map_err(|e| format!("Could not connect: {e}")),
        }
    }

    /// Asks the server to shut down cleanly, and kills it if it won't.
    async fn stop(mut self) {
        let conn = match self.session.take() {
            Some(conn) => Ok(conn),
            None => Conn::new(self.opts.clone()).await,
        };
        if let Ok(mut conn) = conn {
            // The server hangs up as it goes, so this "fails" when it works.
            let _ = conn.query_drop("SHUTDOWN").await;
        }
        if tokio::time::timeout(STOP_TIMEOUT, self.process.wait()).await.is_err() {
            let _ = self.process.kill().await;
        }
    }
}

/// What a run shows.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryOutput {
    /// In order: one per statement, or more for a procedure that returns several.
    results: Vec<StatementResult>,
    /// The error that stopped the file; the statements before it still ran.
    error: Option<QueryError>,
    /// Stop interrupted the file.
    stopped: bool,
    /// The session's current database after the run (`USE` changes it).
    database: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatementResult {
    /// Line where the statement starts.
    line: usize,
    /// The statement's first line, to tell results apart.
    sql: String,
    /// Seconds the statement took, as the shell's "(0.01 sec)".
    seconds: f64,
    #[serde(flatten)]
    outcome: Outcome,
}

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum Outcome {
    /// Rows (SELECT, SHOW, …).
    Table {
        /// What the rows are, for the result's tab: see `table_name`.
        name: Option<String>,
        columns: Vec<String>,
        /// At most MAX_ROWS; NULL is None.
        rows: Vec<Vec<Option<String>>>,
        /// How many rows the statement returned.
        total: usize,
    },
    /// No rows (INSERT, CREATE, …): "Query OK, 2 rows affected".
    Status {
        affected: u64,
        warnings: u16,
        /// The server's extra detail, e.g. "Records: 2  Duplicates: 0  Warnings: 0".
        info: String,
        /// A `USE`, which the shell reports as "Database changed".
        database_changed: bool,
    },
}

#[derive(Serialize)]
struct QueryError {
    line: usize,
    /// As the `mysql` shell prints it, e.g. `ERROR 1146 (42S02): Table 'x.t' doesn't exist`.
    message: String,
}

/// Runs a database file's statements in order, stopping at the first error;
/// or, given the cursor's `line`, only the statement there.
#[tauri::command]
pub async fn run_queries(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    servers: State<'_, Servers>,
    filename: String,
    line: Option<usize>,
) -> Result<QueryOutput, String> {
    let account = current.get()?;
    let source = resolve_file(&app, &current, &db, &filename)?;
    let text =
        tokio::fs::read_to_string(&source).await.map_err(|e| format!("Could not read {filename}: {e}"))?;
    let extension = split_extension(&filename).map(|(_, ext)| ext).unwrap_or_default();
    let (language, runtime) = db.with(|conn| {
        let language = catalog::language(conn, extension)?
            .filter(|language| language.kind == Kind::Database && language.server.is_some())
            .ok_or_else(|| format!("Can't run .{extension} files."))?;
        let runtime = catalog::runtime(conn, &language.runtime)?;
        Ok((language, runtime))
    })?;
    let mut statements = split_statements(&text);
    if let Some(line) = line {
        statements = statement_at(statements, line).into_iter().collect();
    }

    let mut guard = servers.server.lock().await;
    // One server at a time: another account's or database's goes first.
    if let Some(old) = guard.take_if(|s| s.account != account || s.extension != language.extension) {
        old.stop().await;
    }
    // Not started yet, or it stopped (crashed, or killed from outside).
    if !guard.as_mut().is_some_and(|server| matches!(server.process.try_wait(), Ok(None))) {
        let server = start(&app, &account, &language, &runtime).await;
        *guard = Some(server.inspect_err(|e| log::error!("Could not start {}: {e}", runtime.id))?);
    }
    let server = guard.as_mut().expect("started above");
    let mut conn = server.take_session().await?;

    servers.stop.store(false, Ordering::Relaxed);
    *servers.running.lock().unwrap_or_else(|e| e.into_inner()) = Some((server.opts.clone(), conn.id()));
    let (output, broken) = run_file(&mut conn, &statements, &servers.stop, &language.name).await;
    *servers.running.lock().unwrap_or_else(|e| e.into_inner()) = None;
    if !broken {
        server.session = Some(conn);
    }
    Ok(output)
}

/// Runs the statements in order until one fails or `stop` is set. Also
/// returns whether the connection broke (and must not be reused).
async fn run_file(
    conn: &mut Conn,
    statements: &[Statement],
    stop: &AtomicBool,
    name: &str,
) -> (QueryOutput, bool) {
    let mut output = QueryOutput { results: Vec::new(), error: None, stopped: false, database: None };
    for statement in statements {
        if stop.load(Ordering::Relaxed) {
            output.stopped = true;
            break;
        }
        match run_statement(conn, statement, &mut output.results).await {
            Ok(()) => {}
            Err(mysql_async::Error::Server(e)) if e.code == ER_QUERY_INTERRUPTED => {
                output.stopped = true;
                break;
            }
            Err(mysql_async::Error::Server(e)) => {
                let message = format!("ERROR {} ({}): {}", e.code, e.state, e.message);
                output.error = Some(QueryError { line: statement.line, message });
                break;
            }
            Err(e) => {
                let message = format!("Lost the connection to {name}: {e}");
                output.error = Some(QueryError { line: statement.line, message });
                return (output, true);
            }
        }
    }
    output.database = conn.query_first("SELECT DATABASE()").await.ok().flatten().flatten();
    (output, false)
}

/// The tables in the session's current database, for the Tables tab. None
/// when there's nothing to show: the server isn't running (no run yet), or no
/// database is selected.
#[tauri::command]
pub async fn list_tables(
    current: State<'_, CurrentUser>,
    servers: State<'_, Servers>,
) -> Result<Option<Vec<String>>, String> {
    let account = current.get()?;
    let mut guard = servers.server.lock().await;
    let Some(server) = guard.as_mut().filter(|server| server.account == account) else { return Ok(None) };
    let mut conn = server.take_session().await?;
    let tables = conn.query::<String, _>("SHOW TABLES").await;
    server.session = Some(conn);
    match tables {
        Ok(tables) => Ok(Some(tables)),
        Err(mysql_async::Error::Server(e)) if e.code == ER_NO_DB_ERROR => Ok(None),
        Err(e) => Err(format!("Could not list the tables: {e}")),
    }
}

/// All of a table's rows (up to MAX_ROWS shown), for its sub-tab in Tables.
#[tauri::command]
pub async fn table_rows(
    current: State<'_, CurrentUser>,
    servers: State<'_, Servers>,
    table: String,
) -> Result<StatementResult, String> {
    let account = current.get()?;
    let mut guard = servers.server.lock().await;
    let server = guard.as_mut().filter(|server| server.account == account).ok_or("Not connected.")?;
    let mut conn = server.take_session().await?;
    let statement = Statement { line: 0, sql: format!("SELECT * FROM `{}`", table.replace('`', "``")) };
    let mut results = Vec::new();
    let ran = run_statement(&mut conn, &statement, &mut results).await;
    server.session = Some(conn);
    match ran {
        Ok(()) => results.into_iter().next().ok_or_else(|| format!("{table} returned nothing.")),
        Err(mysql_async::Error::Server(e)) => Err(format!("ERROR {} ({}): {}", e.code, e.state, e.message)),
        Err(e) => Err(format!("Could not read {table}: {e}")),
    }
}

/// The Stop button.
#[tauri::command]
pub async fn stop_queries(servers: State<'_, Servers>) -> Result<(), String> {
    servers.interrupt().await
}

/// Runs one statement, adding its result: a table or a status. A stored
/// procedure can return several tables.
async fn run_statement(
    conn: &mut Conn,
    statement: &Statement,
    results: &mut Vec<StatementResult>,
) -> mysql_async::Result<()> {
    let started = Instant::now();
    let sql = statement.sql.lines().next().unwrap_or_default().to_owned();
    let mut result = conn.query_iter(statement.sql.as_str()).await?;
    loop {
        let columns = result.columns().unwrap_or_else(|| Arc::from([]));
        let outcome = if columns.is_empty() {
            let outcome = Outcome::Status {
                affected: result.affected_rows(),
                warnings: result.warnings(),
                info: result.info().into_owned(),
                database_changed: is_use(&statement.sql),
            };
            // Moves on to the next result, if there is one.
            result.next().await?;
            outcome
        } else {
            let mut rows = Vec::new();
            let mut total = 0;
            // Ends at the end of this result, moving on to the next one.
            while let Some(row) = result.next().await? {
                total += 1;
                if rows.len() < MAX_ROWS {
                    rows.push(row.unwrap().into_iter().zip(columns.iter()).map(cell).collect());
                }
            }
            let name = table_name(&statement.sql, &columns);
            let columns = columns.iter().map(|c| c.name_str().into_owned()).collect();
            Outcome::Table { name, columns, rows, total }
        };
        let seconds = started.elapsed().as_secs_f64();
        results.push(StatementResult { line: statement.line, sql: sql.clone(), seconds, outcome });
        if result.is_empty() {
            return Ok(());
        }
    }
}

/// The tables the rows come from (`students`, or `students, marks` for a
/// join), as MySQL reports them; or for SHOW, DESCRIBE and EXPLAIN, whose
/// columns name MySQL's internal tables, the command itself. None for rows
/// from no table, like `SELECT COUNT(*)` or `SELECT 1 + 1`.
fn table_name(sql: &str, columns: &[Column]) -> Option<String> {
    let words: Vec<_> = sql.split_whitespace().collect();
    let command = words.first()?;
    if ["show", "describe", "desc", "explain"].iter().any(|c| command.eq_ignore_ascii_case(c)) {
        return Some(words.join(" "));
    }
    let mut tables: Vec<String> = Vec::new();
    for column in columns {
        let table = column.org_table_str();
        if !table.is_empty() && !tables.iter().any(|t| *t == table) {
            tables.push(table.into_owned());
        }
    }
    (!tables.is_empty()).then(|| tables.join(", "))
}

/// `USE school`: the shell answers "Database changed" instead of "Query OK".
fn is_use(sql: &str) -> bool {
    let mut words = sql.split_whitespace();
    words.next().is_some_and(|word| word.eq_ignore_ascii_case("use")) && words.next().is_some()
}

/// A value as the `mysql` shell shows it. Binary data is shown as hex.
fn cell((value, column): (Value, &Column)) -> Option<String> {
    match value {
        Value::NULL => None,
        Value::Bytes(bytes) if is_binary(column) => Some(format!("0x{}", hex::encode_upper(bytes))),
        Value::Bytes(bytes) => Some(String::from_utf8_lossy(&bytes).into_owned()),
        // Queries come back as text; other kinds are only for prepared statements.
        other => Some(other.as_sql(true)),
    }
}

/// BLOB, BINARY, BIT and the like: bytes, not text.
fn is_binary(column: &Column) -> bool {
    use ColumnType::*;
    const BINARY_CHARSET: u16 = 63;
    column.character_set() == BINARY_CHARSET
        && matches!(
            column.column_type(),
            MYSQL_TYPE_TINY_BLOB
                | MYSQL_TYPE_MEDIUM_BLOB
                | MYSQL_TYPE_LONG_BLOB
                | MYSQL_TYPE_BLOB
                | MYSQL_TYPE_VAR_STRING
                | MYSQL_TYPE_STRING
                | MYSQL_TYPE_VARCHAR
                | MYSQL_TYPE_BIT
                | MYSQL_TYPE_GEOMETRY
        )
}

// --- The server ---------------------------------------------------------------

/// Starts the account's server and waits until it accepts connections.
async fn start(
    app: &AppHandle,
    account: &str,
    language: &Language,
    runtime: &Runtime,
) -> Result<Server, String> {
    let name = &language.name;
    let not_installed = || format!("{name} isn't installed yet. Click New file and download it.");
    let exe = executable_path(app, runtime)?.ok_or_else(not_installed)?;
    if !databases::is_set_up(app, account, language)? {
        return Err(not_installed());
    }
    let data = databases::data_dir(app, account, language)?;
    let vars =
        Vars::default().set("shared", shared_data_dir(app)?).set("runtime", runtime_dir(app, runtime)?);
    let (process, opts, session) = launch(language, runtime, &exe, &data, vars).await?;
    let (account, extension) = (account.to_owned(), language.extension.clone());
    Ok(Server { account, extension, process, opts, session: Some(session) })
}

/// Starts the server on `data` and waits until it accepts connections.
async fn launch(
    language: &Language,
    runtime: &Runtime,
    exe: &Path,
    data: &Path,
    vars: Vars,
) -> Result<(Child, Opts, Conn), String> {
    let name = &language.name;
    let step = language.server.as_ref().ok_or_else(|| format!("{name} has no server."))?;
    // Next to the data folder: `mysql.pid`, `mysql.log`.
    let pid_file = data.with_extension("pid");
    let log = data.with_extension("log");
    stop_leftover(&pid_file, exe).await;

    let port = std::net::TcpListener::bind("127.0.0.1:0")
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .map_err(|e| format!("Could not find a free port for {name}: {e}"))?;
    // Unix sockets have a ~100-character path limit, which app data paths
    // can pass, so it goes in the temp folder. (On Windows it names a pipe.)
    let socket = if cfg!(windows) {
        format!("prepcode-{}", std::process::id())
    } else {
        std::env::temp_dir()
            .join(format!("prepcode-{}.sock", std::process::id()))
            .to_string_lossy()
            .into_owned()
    };
    let vars = vars.set("data", data).set("log", &log).set("port", port.to_string()).set("socket", &socket);

    let mut command = Command::from(step_command(step, runtime, exe, &vars));
    command.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    let mut process = command.spawn().map_err(|e| format!("Could not start {name}: {e}"))?;
    if let Some(pid) = process.id() {
        let _ = std::fs::write(&pid_file, pid.to_string());
    }

    let opts: Opts = OptsBuilder::default()
        .ip_or_hostname("127.0.0.1")
        .tcp_port(port)
        .user(Some("root"))
        .prefer_socket(false)
        .into();
    let deadline = Instant::now() + START_TIMEOUT;
    loop {
        if let Ok(Some(status)) = process.try_wait() {
            return Err(format!("{name} stopped while starting ({status}).{}", log_errors(&log)));
        }
        match Conn::new(opts.clone()).await {
            Ok(session) => return Ok((process, opts, session)),
            Err(_) if Instant::now() < deadline => tokio::time::sleep(Duration::from_millis(200)).await,
            Err(e) => {
                let _ = process.kill().await;
                return Err(format!("{name} didn't start: {e}{}", log_errors(&log)));
            }
        }
    }
}

/// The server's latest errors from its log, to show with a failed start.
fn log_errors(log: &Path) -> String {
    let text = std::fs::read_to_string(log).unwrap_or_default();
    let errors: Vec<_> = text.lines().filter(|line| line.contains("[ERROR]")).collect();
    match errors.len() {
        0 => String::new(),
        n => format!("\n{}", errors[n.saturating_sub(3)..].join("\n")),
    }
}

/// Stops a server left running by a copy of prepcode that crashed or was
/// force-quit; it would still hold the data folder. The pid is checked to
/// still be that server, not some other program that got the number since.
async fn stop_leftover(pid_file: &Path, exe: &Path) {
    let Some(pid) = std::fs::read_to_string(pid_file).ok().and_then(|s| s.trim().parse::<u32>().ok()) else {
        return;
    };
    let Some(exe_name) = exe.file_name().map(|n| n.to_string_lossy().into_owned()) else { return };
    if process_name(pid).is_some_and(|name| name.contains(&exe_name)) {
        kill(pid);
        let deadline = Instant::now() + STOP_TIMEOUT;
        while process_name(pid).is_some() && Instant::now() < deadline {
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }
    let _ = std::fs::remove_file(pid_file);
}

/// The program running as `pid`, if any.
fn process_name(pid: u32) -> Option<String> {
    #[cfg(windows)]
    let output = {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("tasklist")
            .args(["/FI", &format!("PID eq {pid}"), "/FO", "CSV", "/NH"])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .output()
    };
    #[cfg(not(windows))]
    let output = std::process::Command::new("ps").args(["-p", &pid.to_string(), "-o", "comm="]).output();
    let text = String::from_utf8_lossy(&output.ok()?.stdout).trim().to_owned();
    // tasklist prints a message rather than a row when there's no such process.
    (!text.is_empty() && !text.starts_with("INFO:")).then_some(text)
}

fn kill(pid: u32) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F"])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .status();
    }
    #[cfg(unix)]
    // SAFETY: kill only sends a signal; the pid was checked to be our server.
    unsafe {
        libc::kill(pid as libc::pid_t, libc::SIGTERM);
    }
}

// --- Splitting a file into statements -------------------------------------------

/// One statement from a file, and the line it starts on.
#[derive(Debug, PartialEq)]
pub struct Statement {
    pub line: usize,
    pub sql: String,
}

/// The statement on the cursor's line. Between statements (a blank or comment
/// line), the one before it, since the cursor usually sits just after its
/// `;`; above them all, the first.
fn statement_at(statements: Vec<Statement>, line: usize) -> Option<Statement> {
    let before = statements.iter().rposition(|s| s.line <= line).unwrap_or(0);
    statements.into_iter().nth(before)
}

#[derive(Clone, Copy)]
enum Scan {
    Code,
    Quote(char),
    LineComment,
    BlockComment,
}

/// Splits a file into statements like the `mysql` shell does: at `;`, or the
/// delimiter a `DELIMITER //` line sets (for stored procedures, whose bodies
/// contain `;`), but not inside quotes or comments. Comment-only parts are
/// dropped.
pub fn split_statements(text: &str) -> Vec<Statement> {
    let chars: Vec<char> = text.chars().collect();
    // From the statement's first code (not a comment or space) to `end`.
    let statement = |start: usize, end: usize| {
        let line = 1 + chars[..start].iter().filter(|&&c| c == '\n').count();
        let sql = chars[start..end].iter().collect::<String>().trim_end().to_owned();
        Statement { line, sql }
    };
    let mut statements = Vec::new();
    let mut delimiter: Vec<char> = vec![';'];
    let mut start: Option<usize> = None;
    let mut state = Scan::Code;
    let mut i = 0;

    while i < chars.len() {
        let c = chars[i];
        let next = chars.get(i + 1).copied();
        match state {
            Scan::Quote(quote) => {
                if c == '\\' && quote != '`' {
                    i += 1; // skip the escaped character
                } else if c == quote {
                    state = Scan::Code;
                }
            }
            Scan::LineComment if c == '\n' => state = Scan::Code,
            Scan::BlockComment if c == '*' && next == Some('/') => {
                i += 1;
                state = Scan::Code;
            }
            Scan::LineComment | Scan::BlockComment => {}
            Scan::Code => {
                if start.is_none() && !c.is_whitespace() {
                    if let Some((new_delimiter, end)) = delimiter_command(&chars, i) {
                        delimiter = new_delimiter;
                        i = end;
                        continue;
                    }
                }
                if chars[i..].starts_with(&delimiter) {
                    if let Some(start) = start.take() {
                        statements.push(statement(start, i));
                    }
                    i += delimiter.len();
                    continue;
                }
                // `--` starts a comment only when a space (or the line's end) follows.
                let dash_comment =
                    c == '-' && next == Some('-') && chars.get(i + 2).is_none_or(|c| c.is_whitespace());
                if c == '#' || dash_comment {
                    state = Scan::LineComment;
                } else if c == '/' && next == Some('*') {
                    state = Scan::BlockComment;
                    i += 1;
                } else {
                    if matches!(c, '\'' | '"' | '`') {
                        state = Scan::Quote(c);
                    }
                    if start.is_none() && !c.is_whitespace() {
                        start = Some(i);
                    }
                }
            }
        }
        i += 1;
    }
    if let Some(start) = start {
        statements.push(statement(start, chars.len()));
    }
    statements
}

/// A `DELIMITER <x>` line starting at `i`: the new delimiter, and where the
/// line ends.
fn delimiter_command(chars: &[char], i: usize) -> Option<(Vec<char>, usize)> {
    let end = chars[i..].iter().position(|&c| c == '\n').map_or(chars.len(), |p| i + p);
    let line: String = chars[i..end].iter().collect();
    let mut words = line.split_whitespace();
    let command = words.next()?;
    let delimiter = words.next()?;
    command.eq_ignore_ascii_case("delimiter").then(|| (delimiter.chars().collect(), end))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::{self, Kind};
    use crate::databases::tests::set_up_in;
    use crate::runtimes::tests::install_for_this_platform;

    const SAMPLE: &str = "CREATE DATABASE school;
USE school;
CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(20), photo BLOB);
INSERT INTO students VALUES (1, 'Asha', NULL), (2, 'Ravi', x'CAFE');
SELECT * FROM students ORDER BY id;
DELIMITER //
CREATE PROCEDURE both_counts() BEGIN SELECT 1 AS a; SELECT 2 AS b; END //
DELIMITER ;
CALL both_counts();
SHOW   TABLES;
SELECT * FROM teachers;
SELECT 'never runs';";

    /// Real install, setup and server, then a file through run_file.
    /// Run with: cargo test -- --ignored
    #[test]
    #[ignore = "downloads ~170-280 MB"]
    fn runs_a_file_on_mysql() {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let language = catalog.languages.iter().find(|l| l.kind == Kind::Database).unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id == language.runtime).unwrap();
        install_for_this_platform(&runtime.id, |root| {
            let exe = root.join(runtime.executable());
            let data = root.parent().unwrap().join("d").join("mysql");
            set_up_in(&data, language, runtime, &exe, Vars::default().set("runtime", root)).unwrap();

            tauri::async_runtime::block_on(async {
                let vars = Vars::default().set("runtime", root);
                let (process, opts, mut conn) = launch(language, runtime, &exe, &data, vars).await.unwrap();
                let statements = split_statements(SAMPLE);
                let (output, broken) =
                    run_file(&mut conn, &statements, &AtomicBool::new(false), "MySQL").await;
                assert!(!broken);

                let json = serde_json::to_value(&output).unwrap();
                let results = json["results"].as_array().unwrap();
                let kinds: Vec<_> = results.iter().map(|r| r["kind"].as_str().unwrap()).collect();
                // CALL returns its two tables.
                assert_eq!(
                    kinds,
                    ["status", "status", "status", "status", "table", "status", "table", "table", "table"],
                    "{json}"
                );
                assert_eq!(results[0]["sql"], "CREATE DATABASE school");
                assert_eq!(results[0]["affected"], 1);
                assert_eq!(results[1]["databaseChanged"], true);
                assert_eq!(results[3]["affected"], 2);
                assert_eq!(results[3]["info"], "Records: 2  Duplicates: 0  Warnings: 0");
                let tables: Vec<_> = results.iter().filter(|r| r["kind"] == "table").collect();
                assert_eq!(tables[0]["line"], 5);
                assert_eq!(tables[0]["columns"], serde_json::json!(["id", "name", "photo"]));
                assert_eq!(
                    tables[0]["rows"],
                    serde_json::json!([["1", "Asha", null], ["2", "Ravi", "0xCAFE"]])
                );
                assert_eq!(tables[0]["total"], 2);
                let names: Vec<_> = tables.iter().map(|t| t["name"].clone()).collect();
                assert_eq!(
                    names,
                    serde_json::json!(["students", null, null, "SHOW TABLES"]).as_array().unwrap().clone()
                );
                assert_eq!(
                    (tables[1]["rows"][0][0].clone(), tables[2]["rows"][0][0].clone()),
                    ("1".into(), "2".into())
                );
                assert_eq!(json["database"], "school");

                // What list_tables and table_rows run on the same session.
                let tables: Vec<String> = conn.query("SHOW TABLES").await.unwrap();
                assert_eq!(tables, ["students"]);
                let browse = Statement { line: 0, sql: "SELECT * FROM `students`".into() };
                let mut rows = Vec::new();
                run_statement(&mut conn, &browse, &mut rows).await.unwrap();
                let rows = serde_json::to_value(&rows).unwrap();
                assert_eq!(
                    (rows[0]["name"].clone(), rows[0]["total"].clone()),
                    ("students".into(), 2.into())
                );
                assert_eq!(json["error"]["line"], 11);
                assert_eq!(
                    json["error"]["message"],
                    "ERROR 1146 (42S02): Table 'school.teachers' doesn't exist"
                );

                Server {
                    account: String::new(),
                    extension: String::new(),
                    process,
                    opts,
                    session: Some(conn),
                }
                .stop()
                .await;
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
            split("insert into t values ('a;b', \"c;\"); select `x;y` from t;"),
            expected(&[(1, "insert into t values ('a;b', \"c;\")"), (1, "select `x;y` from t")])
        );
        assert_eq!(
            split("select 'it\\'s; ok', 'a''b;c';"),
            expected(&[(1, "select 'it\\'s; ok', 'a''b;c'")])
        );
    }

    #[test]
    fn ignores_comments() {
        assert_eq!(
            split("-- intro; still a comment\nselect 1; # done;\n/* ; */ select 2;\n-- the end"),
            expected(&[(2, "select 1"), (3, "select 2")])
        );
        // Not a comment without a space after --.
        assert_eq!(split("select 5--1;"), expected(&[(1, "select 5--1")]));
    }

    #[test]
    fn finds_the_statement_at_a_line() {
        let text = "-- setup\nUSE school;\n\nSELECT *\nFROM students;  -- all\n\nSHOW TABLES;";
        let at = |line| statement_at(split_statements(text), line).map(|s| s.sql);
        assert_eq!(at(1).as_deref(), Some("USE school"));
        assert_eq!(at(2).as_deref(), Some("USE school"));
        assert_eq!(at(3).as_deref(), Some("USE school"));
        assert_eq!(at(4).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(5).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(6).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(9).as_deref(), Some("SHOW TABLES"));
        assert_eq!(statement_at(split_statements("-- nothing"), 1), None);
    }

    #[test]
    fn follows_delimiter_lines() {
        let text = "DELIMITER //\nCREATE PROCEDURE p()\nBEGIN\n  SELECT 1;\nEND //\ndelimiter ;\nCALL p();";
        assert_eq!(
            split(text),
            expected(&[(2, "CREATE PROCEDURE p()\nBEGIN\n  SELECT 1;\nEND"), (7, "CALL p()")])
        );
    }
}
