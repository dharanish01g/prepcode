//! MySQL: talking to its server with the mysql_async driver, and splitting a
//! file like the `mysql` shell.

use std::sync::Arc;
use std::time::Instant;

use mysql_async::consts::ColumnType;
use mysql_async::prelude::Queryable;
use mysql_async::{Column, Conn, Opts, OptsBuilder, Value};

use super::{command_name, statement, Failure, Outcome, Statement, StatementResult, MAX_ROWS};

/// MySQL's error when KILL QUERY interrupts a statement.
const ER_QUERY_INTERRUPTED: u16 = 1317;
/// MySQL's error for a query that needs a database when none is selected.
const ER_NO_DB_ERROR: u16 = 1046;

pub struct Session {
    opts: Opts,
    /// None after the connection broke, until it's reopened.
    conn: Option<Conn>,
}

/// How to interrupt the statement a session is running.
#[derive(Clone)]
pub struct Cancel {
    opts: Opts,
    id: u32,
}

impl Cancel {
    pub async fn cancel(self) -> Result<(), String> {
        let mut conn = Conn::new(self.opts).await.map_err(|e| e.to_string())?;
        let killed = conn.query_drop(format!("KILL QUERY {}", self.id)).await;
        let _ = conn.disconnect().await;
        killed.map_err(|e| e.to_string())
    }
}

impl Session {
    /// As root, which `--initialize-insecure` creates with no password.
    pub async fn connect(port: u16) -> Result<Session, String> {
        let opts: Opts = OptsBuilder::default()
            .ip_or_hostname("127.0.0.1")
            .tcp_port(port)
            .user(Some("root"))
            .prefer_socket(false)
            .into();
        let conn = Conn::new(opts.clone()).await.map_err(|e| e.to_string())?;
        Ok(Session { opts, conn: Some(conn) })
    }

    pub async fn reconnect(&mut self) -> Result<(), String> {
        if self.conn.is_none() {
            let conn = Conn::new(self.opts.clone()).await.map_err(|e| format!("Could not connect: {e}"))?;
            self.conn = Some(conn);
        }
        Ok(())
    }

    fn conn(&mut self) -> Result<&mut Conn, Failure> {
        self.conn.as_mut().ok_or_else(|| Failure::Lost("Not connected.".into()))
    }

    pub fn cancel(&self) -> Option<Cancel> {
        self.conn.as_ref().map(|conn| Cancel { opts: self.opts.clone(), id: conn.id() })
    }

    pub async fn run(
        &mut self,
        statement: &Statement,
        results: &mut Vec<StatementResult>,
    ) -> Result<(), Failure> {
        match run_statement(self.conn()?, statement, results).await {
            Ok(()) => Ok(()),
            Err(mysql_async::Error::Server(e)) if e.code == ER_QUERY_INTERRUPTED => Err(Failure::Stopped),
            Err(mysql_async::Error::Server(e)) => Err(Failure::Error {
                line: statement.line,
                message: format!("ERROR {} ({}): {}", e.code, e.state, e.message),
            }),
            Err(e) => {
                self.conn = None;
                Err(Failure::Lost(e.to_string()))
            }
        }
    }

    pub async fn database(&mut self) -> Option<String> {
        self.conn.as_mut()?.query_first("SELECT DATABASE()").await.ok().flatten().flatten()
    }

    pub async fn list_tables(&mut self) -> Result<Option<Vec<String>>, String> {
        let conn = self.conn.as_mut().ok_or("Not connected.")?;
        match conn.query::<String, _>("SHOW TABLES").await {
            Ok(tables) => Ok(Some(tables)),
            Err(mysql_async::Error::Server(e)) if e.code == ER_NO_DB_ERROR => Ok(None),
            Err(e) => Err(format!("Could not list the tables: {e}")),
        }
    }

    /// Asks the server to shut down.
    pub async fn shutdown(mut self) {
        if self.reconnect().await.is_ok() {
            if let Some(conn) = self.conn.as_mut() {
                // The server hangs up as it goes, so this "fails" when it works.
                let _ = conn.query_drop("SHUTDOWN").await;
            }
        }
    }
}

/// `SELECT * FROM` the table, quoted.
pub fn select_all(table: &str) -> String {
    format!("SELECT * FROM `{}`", table.replace('`', "``"))
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
            Outcome::Table { name, columns, rows, total, info: String::new() }
        };
        let seconds = started.elapsed().as_secs_f64();
        results.push(StatementResult { line: statement.line, sql: sql.clone(), seconds, outcome });
        if result.is_empty() {
            return Ok(());
        }
    }
}

/// The tables the rows come from, as MySQL reports them, or the command for
/// SHOW and the like (see `Outcome::Table`).
fn table_name(sql: &str, columns: &[Column]) -> Option<String> {
    if let Some(command) = command_name(sql) {
        return Some(command);
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

// --- Splitting a file into statements -------------------------------------------

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
    let mut statements = Vec::new();
    let mut delimiter: Vec<char> = vec![';'];
    // From the statement's first code (not a comment or space).
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
                        statements.push(statement(&chars, start, i));
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
        statements.push(statement(&chars, start, chars.len()));
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
    use super::super::{launch, run_file, Server, Servers};
    use super::*;
    use crate::catalog::{self, Engine, Vars};
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
        let language = catalog.languages.iter().find(|l| l.extension == "mysql.sql").unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id == language.runtime).unwrap();
        install_for_this_platform(&runtime.id, |root| {
            let exe = root.join(runtime.executable());
            let data = root.parent().unwrap().join("d").join("mysql");
            set_up_in(&data, language, runtime, &exe, Vars::default().set("runtime", root)).unwrap();

            tauri::async_runtime::block_on(async {
                let vars = Vars::default().set("runtime", root);
                let (process, mut session) =
                    launch(language, runtime, Engine::Mysql, &exe, &data, vars).await.unwrap();
                let output =
                    run_file(&mut session, &split_statements(SAMPLE), &Servers::default(), "MySQL").await;

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
                assert_eq!(json["error"]["line"], 11);
                assert_eq!(
                    json["error"]["message"],
                    "ERROR 1146 (42S02): Table 'school.teachers' doesn't exist"
                );

                // What list_tables and table_rows run on the same session.
                assert_eq!(session.list_tables().await.unwrap(), Some(vec!["students".to_owned()]));
                let rows = serde_json::to_value(session.table_rows("students").await.unwrap()).unwrap();
                assert_eq!((rows["name"].clone(), rows["total"].clone()), ("students".into(), 2.into()));

                let (account, extension) = (String::new(), String::new());
                Server { account, extension, process, session, exe, data }.stop().await;
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
    fn follows_delimiter_lines() {
        let text = "DELIMITER //\nCREATE PROCEDURE p()\nBEGIN\n  SELECT 1;\nEND //\ndelimiter ;\nCALL p();";
        assert_eq!(
            split(text),
            expected(&[(2, "CREATE PROCEDURE p()\nBEGIN\n  SELECT 1;\nEND"), (7, "CALL p()")])
        );
    }
}
