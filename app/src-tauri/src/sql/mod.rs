//! Running a database file's queries on the signed-in account's own server.
//!
//! Each database's server (MySQL, PostgreSQL) starts on the first Run of one
//! of its files and keeps running, with one session every run shares, like
//! its shell: `USE school;` (MySQL) or `\c school` (PostgreSQL) in one run
//! still applies in the next. Servers stop on logout and when the app exits.
//! The data stays in the account's folder (see databases.rs).
//!
//! Each statement's result comes back like the shell shows it: rows as a
//! table, or a status such as "Query OK, 1 row affected", and the error that
//! stopped the file, if any. What every engine shares is here; how to talk
//! to each one, and how its shell splits a file, is in its own module.

mod mysql;
mod postgres;
pub mod practice;

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, State};
use tokio::process::{Child, Command};

use crate::auth::CurrentUser;
use crate::catalog::{self, Engine, Kind, Language, Runtime, Vars};
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
/// For a database a newer catalog added (see `Engine::Unknown`).
const UPDATE_NEEDED: &str = "This database needs a newer prepcode. Update it from Profile > About.";

#[derive(Default)]
pub struct Servers {
    /// The signed-in account's running servers, at most one per database.
    /// Held for a whole run, so runs, starting and stopping take turns.
    servers: tokio::sync::Mutex<Vec<Server>>,
    /// While a run is in progress, how to interrupt it, for Stop.
    running: Mutex<Option<Cancel>>,
    /// Stop was pressed: skip the rest of the file.
    stop: AtomicBool,
}

struct Server {
    account: String,
    extension: String,
    process: Process,
    /// The session runs share.
    session: Session,
    /// The server's program and data folder, for engines that are shut down
    /// by a command rather than over the connection.
    exe: PathBuf,
    data: PathBuf,
}

impl Servers {
    /// Stops every running server: on logout and when the app exits.
    pub async fn stop(&self) {
        // A long query holds the lock; interrupt it first.
        let _ = self.interrupt().await;
        let servers = std::mem::take(&mut *self.servers.lock().await);
        for server in servers {
            server.stop().await;
        }
    }

    /// Interrupts the statement running now and skips the rest of the file.
    async fn interrupt(&self) -> Result<(), String> {
        let running = self.running.lock().unwrap_or_else(|e| e.into_inner()).clone();
        let Some(cancel) = running else { return Ok(()) };
        self.stop.store(true, Ordering::Relaxed);
        cancel.cancel().await.map_err(|e| format!("Could not stop: {e}"))
    }

    fn set_running(&self, cancel: Option<Cancel>) {
        *self.running.lock().unwrap_or_else(|e| e.into_inner()) = cancel;
    }
}

impl Server {
    /// Asks the server to shut down cleanly, and kills it if it won't.
    async fn stop(mut self) {
        match self.session {
            Session::Mysql(session) => session.shutdown().await,
            Session::Postgres(session) => {
                drop(session);
                postgres::shutdown(&self.exe, &self.data).await;
            }
        }
        if !self.process.exited_within(STOP_TIMEOUT).await {
            self.process.kill().await;
        }
    }

    /// Whether it's still there to run queries on.
    async fn is_running(&mut self) -> bool {
        match &mut self.process {
            Process::Child(child) => matches!(child.try_wait(), Ok(None)),
            // Not prepcode's child, so ask it: reconnecting does nothing while
            // the connection is open, and fails once the server is gone.
            Process::Detached { .. } => self.session.reconnect().await.is_ok(),
        }
    }
}

/// A running server's process.
enum Process {
    /// Started by prepcode, as its child (MySQL).
    Child(Box<Child>),
    /// Started by a launcher that exits once the server is ready: PostgreSQL's
    /// `pg_ctl`, which on Windows also drops administrator rights, which
    /// postgres.exe refuses to run with. Its pid, and its program's name to
    /// check the pid is still it.
    Detached { pid: u32, program: String },
}

impl Process {
    /// Waits up to `timeout` for it to exit; whether it did.
    async fn exited_within(&mut self, timeout: Duration) -> bool {
        match self {
            Process::Child(child) => tokio::time::timeout(timeout, child.wait()).await.is_ok(),
            Process::Detached { pid, program } => {
                let deadline = Instant::now() + timeout;
                while is_program(*pid, program) {
                    if Instant::now() >= deadline {
                        return false;
                    }
                    tokio::time::sleep(Duration::from_millis(200)).await;
                }
                true
            }
        }
    }

    /// Kills it and, on Windows, the processes it started (PostgreSQL runs
    /// one per connection, which would hold its data folder).
    async fn kill(&mut self) {
        match self {
            Process::Child(child) => {
                if let Some(pid) = child.id() {
                    kill(pid, true);
                }
                let _ = child.kill().await;
            }
            Process::Detached { pid, program } => {
                if is_program(*pid, program) {
                    kill(*pid, true);
                }
            }
        }
    }
}

/// A connection to one engine's server.
enum Session {
    Mysql(mysql::Session),
    Postgres(Box<postgres::Session>),
}

/// How to interrupt the statement a session is running.
#[derive(Clone)]
enum Cancel {
    Mysql(mysql::Cancel),
    Postgres(postgres::Cancel),
}

impl Cancel {
    async fn cancel(self) -> Result<(), String> {
        match self {
            Cancel::Mysql(cancel) => cancel.cancel().await,
            Cancel::Postgres(cancel) => cancel.cancel().await,
        }
    }
}

/// Why a statement didn't finish.
enum Failure {
    /// Stop interrupted it.
    Stopped,
    /// The server rejected it, as the shell prints it, at the line it points to.
    Error { line: usize, message: String },
    /// The connection broke; the session reconnects the next time it's used.
    Lost(String),
}

impl Session {
    /// Connects to a server on `data` listening on 127.0.0.1:`port`. One attempt.
    async fn connect(engine: Engine, port: u16, data: &Path) -> Result<Session, String> {
        Ok(match engine {
            Engine::Mysql => Session::Mysql(mysql::Session::connect(port).await?),
            Engine::Postgres => {
                let password = databases::password(data);
                Session::Postgres(Box::new(postgres::Session::connect(port, password).await?))
            }
            Engine::Unknown => return Err(UPDATE_NEEDED.into()),
        })
    }

    /// Reconnects if the connection broke.
    async fn reconnect(&mut self) -> Result<(), String> {
        match self {
            Session::Mysql(session) => session.reconnect().await,
            Session::Postgres(session) => session.reconnect().await,
        }
    }

    /// How to interrupt what it runs next, while connected.
    fn cancel(&self) -> Option<Cancel> {
        match self {
            Session::Mysql(session) => session.cancel().map(Cancel::Mysql),
            Session::Postgres(session) => session.cancel().map(Cancel::Postgres),
        }
    }

    /// Runs one statement, adding its results.
    async fn run(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        match self {
            Session::Mysql(session) => session.run(statement, results).await,
            Session::Postgres(session) => session.run(statement, results).await,
        }
    }

    /// The current database, if one is selected.
    async fn database(&mut self) -> Option<String> {
        match self {
            Session::Mysql(session) => session.database().await,
            Session::Postgres(session) => session.database(),
        }
    }

    /// The tables in the current database; None with no database selected.
    async fn list_tables(&mut self) -> Result<Option<Vec<String>>, String> {
        match self {
            Session::Mysql(session) => session.list_tables().await,
            Session::Postgres(session) => session.list_tables().await,
        }
    }

    /// A session of its own on the same server, in the practice database
    /// (see practice.rs). The shared session is left as it was.
    async fn open_practice(&self) -> Result<Session, String> {
        Ok(match self {
            Session::Mysql(session) => Session::Mysql(session.open_another().await?),
            Session::Postgres(session) => {
                Session::Postgres(Box::new(session.open_practice(practice::DATABASE).await?))
            }
        })
    }

    async fn close(self) {
        match self {
            Session::Mysql(session) => session.close().await,
            Session::Postgres(session) => drop(session),
        }
    }

    /// All of a table's rows (up to MAX_ROWS shown).
    async fn table_rows(&mut self, table: &str) -> Result<StatementResult, String> {
        let sql = match self {
            Session::Mysql(_) => mysql::select_all(table),
            Session::Postgres(session) => return session.table_rows(table).await,
        };
        let mut results = Vec::new();
        match self.run(&Statement::new(0, sql), &mut results).await {
            Ok(()) => results.into_iter().next().ok_or_else(|| format!("{table} returned nothing.")),
            Err(Failure::Error { message, .. }) => Err(message),
            Err(Failure::Lost(e)) => Err(format!("Could not read {table}: {e}")),
            Err(Failure::Stopped) => Err("Stopped.".into()),
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
    /// The session's current database after the run (`USE` or `\c` changes it).
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
        /// What the rows are, for the result's tab: the tables they come from
        /// (`students`, or `students, marks` for a join), or the command for
        /// SHOW, DESCRIBE, EXPLAIN and the like. None for rows from no table,
        /// like `SELECT COUNT(*)` or `SELECT 1 + 1`.
        name: Option<String>,
        columns: Vec<String>,
        /// At most MAX_ROWS; NULL is None.
        rows: Vec<Vec<Option<String>>>,
        /// How many rows the statement returned.
        total: usize,
        /// What the server said on the side, e.g. a function's RAISE NOTICE
        /// from PostgreSQL.
        info: String,
    },
    /// No rows (INSERT, CREATE, …): "Query OK, 2 rows affected".
    Status {
        affected: u64,
        warnings: u16,
        /// The server's extra detail, e.g. "Records: 2  Duplicates: 0  Warnings: 0"
        /// from MySQL, or PostgreSQL's notices.
        info: String,
        /// A `USE` or `\c`, which the shell reports as "Database changed".
        database_changed: bool,
    },
}

#[derive(Serialize)]
struct QueryError {
    line: usize,
    /// As the shell prints it, e.g. `ERROR 1146 (42S02): Table 'x.t' doesn't exist`.
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
    let (language, runtime, engine) = database_language(&db, extension)?;
    let mut statements = split_statements(engine, &text);
    if let Some(line) = line {
        statements = statement_at(statements, line).into_iter().collect();
    }

    let mut guard = servers.servers.lock().await;
    let server = running_server(&app, &account, &language, &runtime, engine, &mut guard).await?;
    servers.stop.store(false, Ordering::Relaxed);
    Ok(run_file(&mut server.session, &statements, &servers, &language.name).await)
}

/// The database with this extension (e.g. "mysql.sql"), its runtime and engine.
fn database_language(db: &Db, extension: &str) -> Result<(Language, Runtime, Engine), String> {
    db.with(|conn| {
        let language = catalog::language(conn, extension)?
            .filter(|language| language.kind == Kind::Database && language.server.is_some())
            .ok_or_else(|| format!("Can't run .{extension} files."))?;
        let engine = language.engine.ok_or_else(|| format!("Can't run .{extension} files."))?;
        if engine == Engine::Unknown {
            return Err(UPDATE_NEEDED.into());
        }
        let runtime = catalog::runtime(conn, &language.runtime)?;
        Ok((language, runtime, engine))
    })
}

/// The account's server for `language`, started if it isn't running.
async fn running_server<'a>(
    app: &AppHandle,
    account: &str,
    language: &Language,
    runtime: &Runtime,
    engine: Engine,
    guard: &'a mut Vec<Server>,
) -> Result<&'a mut Server, String> {
    // Servers belong to the signed-in account: another account's go first.
    let (mine, others) = std::mem::take(guard).into_iter().partition(|s| s.account == account);
    *guard = mine;
    for server in others {
        server.stop().await;
    }
    let found = guard.iter_mut().position(|server| server.extension == language.extension);
    let running = match found {
        Some(i) => guard[i].is_running().await,
        None => false,
    };
    let index = match found {
        Some(i) if running => i,
        // Not started yet, or it stopped (crashed, or killed from outside).
        found => {
            // A server left hanging is stopped when the new one starts (see
            // stop_leftover).
            if let Some(i) = found {
                guard.remove(i);
            }
            let server = start(app, account, language, runtime, engine).await;
            guard.push(server.inspect_err(|e| log::error!("Could not start {}: {e}", runtime.id))?);
            guard.len() - 1
        }
    };
    Ok(&mut guard[index])
}

/// Runs the statements in order until one fails or Stop is pressed.
async fn run_file(
    session: &mut Session,
    statements: &[Statement],
    servers: &Servers,
    name: &str,
) -> QueryOutput {
    let mut output = QueryOutput { results: Vec::new(), error: None, stopped: false, database: None };
    let lost = |line, e| Some(QueryError { line, message: format!("Lost the connection to {name}: {e}") });
    for statement in statements {
        if servers.stop.load(Ordering::Relaxed) {
            output.stopped = true;
            break;
        }
        if let Err(e) = session.reconnect().await {
            output.error = lost(statement.line, e);
            break;
        }
        // Set for every statement: `\c` connects anew, with its own way to stop.
        servers.set_running(session.cancel());
        match session.run(statement, &mut output.results).await {
            Ok(()) => {}
            Err(Failure::Stopped) => {
                output.stopped = true;
                break;
            }
            Err(Failure::Error { line, message }) => {
                output.error = Some(QueryError { line, message });
                break;
            }
            Err(Failure::Lost(e)) => {
                output.error = lost(statement.line, e);
                break;
            }
        }
    }
    servers.set_running(None);
    output.database = session.database().await;
    output
}

/// The account's server for the database with this extension, if it's running.
fn server_for<'a>(servers: &'a mut [Server], account: &str, extension: &str) -> Option<&'a mut Server> {
    servers.iter_mut().find(|server| server.account == account && server.extension == extension)
}

/// The tables in the session's current database, for the Tables tab. None
/// when there's nothing to show: the server isn't running (no run yet), or no
/// database is selected.
#[tauri::command]
pub async fn list_tables(
    current: State<'_, CurrentUser>,
    servers: State<'_, Servers>,
    extension: String,
) -> Result<Option<Vec<String>>, String> {
    let account = current.get()?;
    let mut guard = servers.servers.lock().await;
    let Some(server) = server_for(&mut guard, &account, &extension) else { return Ok(None) };
    server.session.reconnect().await?;
    server.session.list_tables().await
}

/// All of a table's rows (up to MAX_ROWS shown), for its sub-tab in Tables.
#[tauri::command]
pub async fn table_rows(
    current: State<'_, CurrentUser>,
    servers: State<'_, Servers>,
    extension: String,
    table: String,
) -> Result<StatementResult, String> {
    let account = current.get()?;
    let mut guard = servers.servers.lock().await;
    let server = server_for(&mut guard, &account, &extension).ok_or("Not connected.")?;
    server.session.reconnect().await?;
    server.session.table_rows(&table).await
}

/// The Stop button.
#[tauri::command]
pub async fn stop_queries(servers: State<'_, Servers>) -> Result<(), String> {
    servers.interrupt().await
}

/// For SHOW, DESCRIBE, EXPLAIN and the like, whose columns name the server's
/// internal tables, the command itself names the rows.
fn command_name(sql: &str) -> Option<String> {
    let words: Vec<_> = sql.split_whitespace().collect();
    let command = words.first()?;
    ["show", "describe", "desc", "explain"]
        .iter()
        .any(|c| command.eq_ignore_ascii_case(c))
        .then(|| words.join(" "))
}

// --- The server ---------------------------------------------------------------

/// Starts the account's server and waits until it accepts connections.
async fn start(
    app: &AppHandle,
    account: &str,
    language: &Language,
    runtime: &Runtime,
    engine: Engine,
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
    let (process, session) = launch(language, runtime, engine, &exe, &data, vars).await?;
    let (account, extension) = (account.to_owned(), language.extension.clone());
    Ok(Server { account, extension, process, session, exe, data })
}

/// Starts the server on `data` and waits until it accepts connections.
async fn launch(
    language: &Language,
    runtime: &Runtime,
    engine: Engine,
    exe: &Path,
    data: &Path,
    vars: Vars,
) -> Result<(Process, Session), String> {
    let name = &language.name;
    let step = language.server.as_ref().ok_or_else(|| format!("{name} has no server."))?;
    // Next to the data folder: `mysql.pid`, `mysql.log`.
    let pid_file = data.with_extension("pid");
    let log = data.with_extension("log");
    let program = exe.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    stop_leftover(&pid_file, &program).await;
    // A fresh log each start: it's for this run's problems, and would grow
    // forever otherwise.
    let _ = std::fs::File::create(&log);

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

    // A server that isn't told where to write its log (no `{log}`) prints
    // it, so that goes in the log file instead.
    let writes_own_log = step.args.iter().any(|arg| arg.contains("{log}"));
    let stderr = match writes_own_log {
        true => Stdio::null(),
        false => std::fs::File::create(&log).map(Stdio::from).unwrap_or_else(|_| Stdio::null()),
    };
    let mut command = Command::from(step_command(step, runtime, exe, &vars));
    command.stdin(Stdio::null()).stdout(Stdio::null()).stderr(stderr).kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    let mut child = command.spawn().map_err(|e| format!("Could not start {name}: {e}"))?;

    let mut process = match engine {
        // pg_ctl waits until the server is ready (or gave up), then exits.
        Engine::Postgres => {
            let waited = tokio::time::timeout(START_TIMEOUT + Duration::from_secs(10), child.wait()).await;
            let started = postgres::postmaster_pid(data).map(|pid| Process::Detached { pid, program });
            match waited {
                Ok(Ok(status)) if status.success() => {
                    started.ok_or_else(|| format!("{name} started but didn't say its process id."))?
                }
                failed => {
                    let _ = child.kill().await;
                    if let Some(mut server) = started {
                        server.kill().await;
                    }
                    let why = match failed {
                        Ok(Ok(status)) => format!("{name} stopped while starting ({status})."),
                        Ok(Err(e)) => format!("Could not start {name}: {e}"),
                        Err(_) => format!("{name} didn't start in time."),
                    };
                    return Err(format!("{why}{}", log_errors(&log)));
                }
            }
        }
        _ => Process::Child(Box::new(child)),
    };
    let pid = match &process {
        Process::Child(child) => child.id(),
        Process::Detached { pid, .. } => Some(*pid),
    };
    if let Some(pid) = pid {
        let _ = std::fs::write(&pid_file, pid.to_string());
    }

    let deadline = Instant::now() + START_TIMEOUT;
    loop {
        let stopped = match &mut process {
            Process::Child(child) => child.try_wait().ok().flatten().map(|status| status.to_string()),
            Process::Detached { pid, program } => (!is_program(*pid, program)).then(|| "it exited".into()),
        };
        if let Some(status) = stopped {
            return Err(format!("{name} stopped while starting ({status}).{}", log_errors(&log)));
        }
        match Session::connect(engine, port, data).await {
            Ok(session) => return Ok((process, session)),
            Err(_) if Instant::now() < deadline => tokio::time::sleep(Duration::from_millis(200)).await,
            Err(e) => {
                process.kill().await;
                return Err(format!("{name} didn't start: {e}{}", log_errors(&log)));
            }
        }
    }
}

/// The server's latest errors from its log, to show with a failed start:
/// MySQL marks them `[ERROR]`, PostgreSQL `FATAL:` and the like.
fn log_errors(log: &Path) -> String {
    let text = std::fs::read_to_string(log).unwrap_or_default();
    let is_error =
        |line: &&str| ["[ERROR]", "ERROR:", "FATAL:", "PANIC:"].iter().any(|mark| line.contains(mark));
    let errors: Vec<_> = text.lines().filter(is_error).collect();
    match errors.len() {
        0 => String::new(),
        n => format!("\n{}", errors[n.saturating_sub(3)..].join("\n")),
    }
}

/// Stops a server left running by a copy of prepcode that crashed or was
/// force-quit; it would still hold the data folder. The pid is checked to
/// still be that server, not some other program that got the number since.
async fn stop_leftover(pid_file: &Path, program: &str) {
    let Some(pid) = std::fs::read_to_string(pid_file).ok().and_then(|s| s.trim().parse::<u32>().ok()) else {
        return;
    };
    if !program.is_empty() && is_program(pid, program) {
        kill(pid, false);
        let deadline = Instant::now() + STOP_TIMEOUT;
        while process_name(pid).is_some() && Instant::now() < deadline {
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }
    let _ = std::fs::remove_file(pid_file);
}

/// Whether `pid` is still `program`, not some other program that got the
/// number since.
fn is_program(pid: u32, program: &str) -> bool {
    process_name(pid).is_some_and(|name| name.contains(program))
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

/// Ends a server: on Windows with the processes it started (/T), which would
/// otherwise keep its data folder; on Unix they exit when it does. `force`
/// doesn't let it shut down cleanly first.
fn kill(pid: u32, force: bool) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = force;
        let _ = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .status();
    }
    #[cfg(unix)]
    // SAFETY: kill only sends a signal; the pid was checked to be our server.
    unsafe {
        libc::kill(pid as libc::pid_t, if force { libc::SIGKILL } else { libc::SIGTERM });
    }
}

// --- Splitting a file into statements -------------------------------------------

/// One statement from a file, and the line it starts on.
#[derive(Debug, PartialEq)]
pub struct Statement {
    pub line: usize,
    pub sql: String,
    /// PostgreSQL's `COPY … FROM STDIN`: the lines after it, up to `\.`.
    pub copy_data: Option<String>,
}

impl Statement {
    fn new(line: usize, sql: String) -> Statement {
        Statement { line, sql, copy_data: None }
    }
}

/// Splits a file into statements the way the engine's shell does.
fn split_statements(engine: Engine, text: &str) -> Vec<Statement> {
    match engine {
        Engine::Mysql => mysql::split_statements(text),
        Engine::Postgres => postgres::split_statements(text),
        Engine::Unknown => Vec::new(),
    }
}

/// The statement starting at char `start` and ending before `end`, without
/// trailing space, and the line it starts on.
fn statement(chars: &[char], start: usize, end: usize) -> Statement {
    let line = 1 + chars[..start].iter().filter(|&&c| c == '\n').count();
    let sql = chars[start..end].iter().collect::<String>().trim_end().to_owned();
    Statement::new(line, sql)
}

/// The statement on the cursor's line. Between statements (a blank or comment
/// line), the one before it, since the cursor usually sits just after its
/// `;`; above them all, the first.
fn statement_at(statements: Vec<Statement>, line: usize) -> Option<Statement> {
    let before = statements.iter().rposition(|s| s.line <= line).unwrap_or(0);
    statements.into_iter().nth(before)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_the_statement_at_a_line() {
        let text = "-- setup\nUSE school;\n\nSELECT *\nFROM students;  -- all\n\nSHOW TABLES;";
        let at = |line| statement_at(mysql::split_statements(text), line).map(|s| s.sql);
        assert_eq!(at(1).as_deref(), Some("USE school"));
        assert_eq!(at(2).as_deref(), Some("USE school"));
        assert_eq!(at(3).as_deref(), Some("USE school"));
        assert_eq!(at(4).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(5).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(6).as_deref(), Some("SELECT *\nFROM students"));
        assert_eq!(at(9).as_deref(), Some("SHOW TABLES"));
        assert_eq!(statement_at(mysql::split_statements("-- nothing"), 1), None);
    }

    #[test]
    fn names_commands() {
        assert_eq!(command_name("show   tables").as_deref(), Some("show tables"));
        assert_eq!(command_name("EXPLAIN SELECT 1").as_deref(), Some("EXPLAIN SELECT 1"));
        assert_eq!(command_name("SELECT 1"), None);
    }
}
