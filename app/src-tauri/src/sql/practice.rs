//! Checking a SQL practice answer on the account's own server.
//!
//! A question has tables, and test cases that each fill them with their own
//! rows. For each case, the practice area is emptied, the tables are made and
//! filled, and the student's query runs; the rows its last SELECT returns are
//! the answer, which the app compares with the case's expected rows.
//!
//! Practice has a connection of its own, so it never changes the database the
//! Database view's session has selected. On MySQL the practice area is a
//! database; on PostgreSQL, a schema in a database of its own, since a
//! session can't switch databases.

use std::collections::HashMap;
use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use super::{
    database_language, running_server, split_statements, Failure, Outcome, Servers, Session, Statement,
};
use crate::auth::CurrentUser;
use crate::catalog::Engine;
use crate::db::Db;

/// MySQL's practice database, and the database PostgreSQL's practice schema is in.
pub const DATABASE: &str = "prepcode_practice";
/// PostgreSQL's practice schema.
const SCHEMA: &str = "practice";
/// How long one statement of the student's may run, so a runaway join
/// doesn't hang the check.
const TIMEOUT_MS: u32 = 10_000;

/// What a check needs of the question: its tables, and its test cases.
#[derive(Deserialize)]
pub struct Question {
    tables: Vec<Table>,
    cases: Vec<Case>,
}

#[derive(Deserialize)]
pub struct Table {
    name: String,
    columns: Vec<Column>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    name: String,
    /// As written in CREATE TABLE, e.g. "VARCHAR(50)".
    #[serde(rename = "type")]
    sql_type: String,
    #[serde(default)]
    primary_key: bool,
}

/// One test case: each table's rows, by table name. NULL is None.
#[derive(Deserialize)]
pub struct Case {
    rows: HashMap<String, Vec<Vec<Option<String>>>>,
}

/// What the query gave on one case.
#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CaseRun {
    /// The rows of its last SELECT (at most MAX_ROWS).
    Rows { columns: Vec<String>, rows: Vec<Vec<Option<String>>> },
    /// The error that stopped it, at its line in the query.
    Error { line: usize, message: String },
}

/// Runs the student's `query` on each of the question's cases, in order, on the server for
/// `extension` (e.g. "mysql.sql"). Fails as a whole only when a case's
/// tables can't be set up, which is the question's fault, not the query's.
#[tauri::command]
pub async fn check_sql_practice(
    app: AppHandle,
    current: State<'_, CurrentUser>,
    db: State<'_, Db>,
    servers: State<'_, Servers>,
    extension: String,
    question: Question,
    query: String,
) -> Result<Vec<CaseRun>, String> {
    let account = current.get()?;
    let (language, runtime, engine) = database_language(&db, &extension)?;
    let statements = split_statements(engine, &query);
    if statements.is_empty() {
        return Err("Write a query first.".into());
    }
    // Held for the whole check, so it takes turns with Database runs.
    let mut guard = servers.servers.lock().await;
    let server = running_server(&app, &account, &language, &runtime, engine, &mut guard).await?;
    check(&server.session, engine, &question, &statements, &servers).await
}

/// Runs the statements on each case, on a session of its own beside `shared`.
async fn check(
    shared: &Session,
    engine: Engine,
    question: &Question,
    statements: &[Statement],
    servers: &Servers,
) -> Result<Vec<CaseRun>, String> {
    let mut session = shared.open_practice().await?;
    servers.stop.store(false, Ordering::Relaxed);

    let mut runs = Vec::new();
    let mut outcome = Ok(());
    for case in &question.cases {
        if let Err(e) = set_up(&mut session, engine, &question.tables, case).await {
            outcome = Err(e);
            break;
        }
        runs.push(run_query(&mut session, statements, servers).await);
    }
    // Leaves nothing behind for the student to find in Database.
    let _ = run_all(&mut session, &clear_statements(engine)).await;
    session.close().await;
    outcome.map(|()| runs)
}

/// Empties the practice area and fills it with the case's tables.
async fn set_up(session: &mut Session, engine: Engine, tables: &[Table], case: &Case) -> Result<(), String> {
    let mut statements = reset_statements(engine);
    statements.extend(table_statements(engine, tables, case)?);
    run_all(session, &statements).await.map_err(|e| format!("Could not set up this question's tables: {e}"))
}

/// Runs prepcode's own statements, stopping at the first that fails.
async fn run_all(session: &mut Session, statements: &[String]) -> Result<(), String> {
    for sql in statements {
        let mut results = Vec::new();
        match session.run(&Statement::new(0, sql.clone()), &mut results).await {
            Ok(()) => {}
            Err(Failure::Error { message, .. }) => return Err(message),
            Err(Failure::Lost(e)) => return Err(format!("Lost the connection: {e}")),
            Err(Failure::Stopped) => return Err("Stopped.".into()),
        }
    }
    Ok(())
}

/// Runs the student's statements in order; the last one that returned rows
/// is the answer.
async fn run_query(session: &mut Session, statements: &[Statement], servers: &Servers) -> CaseRun {
    let mut results = Vec::new();
    for statement in statements {
        servers.set_running(session.cancel());
        let ran = session.run(statement, &mut results).await;
        servers.set_running(None);
        let error = |message| CaseRun::Error { line: statement.line, message };
        match ran {
            Ok(()) => {}
            Err(Failure::Error { line, message }) => return CaseRun::Error { line, message },
            Err(Failure::Stopped) => return error("Stopped.".into()),
            Err(Failure::Lost(e)) => return error(format!("Lost the connection: {e}")),
        }
    }
    let answer = results.into_iter().rev().find_map(|result| match result.outcome {
        Outcome::Table { columns, rows, .. } => Some(CaseRun::Rows { columns, rows }),
        Outcome::Status { .. } => None,
    });
    answer.unwrap_or_else(|| CaseRun::Error {
        line: statements.last().map_or(1, |statement| statement.line),
        message: "Your query didn't return any rows. End it with a SELECT.".into(),
    })
}

/// Empties the practice area, and limits how long each statement may run.
/// The ROLLBACK first ends a transaction the last query left open: on
/// PostgreSQL, after an error in one, nothing else would run.
fn reset_statements(engine: Engine) -> Vec<String> {
    let mut statements = vec!["ROLLBACK".to_owned()];
    statements.extend(clear_statements(engine));
    match engine {
        Engine::Mysql => statements.extend([
            format!("CREATE DATABASE `{DATABASE}`"),
            format!("USE `{DATABASE}`"),
            format!("SET SESSION max_execution_time = {TIMEOUT_MS}"),
        ]),
        _ => statements.extend([
            format!("CREATE SCHEMA \"{SCHEMA}\""),
            format!("SET search_path TO \"{SCHEMA}\""),
            format!("SET statement_timeout = {TIMEOUT_MS}"),
        ]),
    }
    statements
}

/// Drops the practice area and everything in it.
fn clear_statements(engine: Engine) -> Vec<String> {
    match engine {
        Engine::Mysql => vec![format!("DROP DATABASE IF EXISTS `{DATABASE}`")],
        _ => vec![format!("DROP SCHEMA IF EXISTS \"{SCHEMA}\" CASCADE")],
    }
}

/// CREATE TABLE for each table, then one INSERT of the case's rows for each.
fn table_statements(engine: Engine, tables: &[Table], case: &Case) -> Result<Vec<String>, String> {
    if let Some(name) = case.rows.keys().find(|name| !tables.iter().any(|table| table.name == **name)) {
        return Err(format!("the case has rows for {name}, which isn't one of its tables."));
    }
    let mut statements = Vec::new();
    for table in tables {
        let mut parts = Vec::new();
        for column in &table.columns {
            if !is_column_type(&column.sql_type) {
                return Err(format!("{}.{} has no valid type.", table.name, column.name));
            }
            parts.push(format!("{} {}", quote(engine, &column.name), column.sql_type));
        }
        let keys: Vec<_> = table
            .columns
            .iter()
            .filter(|column| column.primary_key)
            .map(|c| quote(engine, &c.name))
            .collect();
        if !keys.is_empty() {
            parts.push(format!("PRIMARY KEY ({})", keys.join(", ")));
        }
        statements.push(format!("CREATE TABLE {} ({})", quote(engine, &table.name), parts.join(", ")));
    }
    for table in tables {
        let rows = case.rows.get(&table.name).map(Vec::as_slice).unwrap_or_default();
        if rows.is_empty() {
            continue;
        }
        let mut values = Vec::new();
        for row in rows {
            if row.len() != table.columns.len() {
                return Err(format!(
                    "a row of {} has {} values, not {}.",
                    table.name,
                    row.len(),
                    table.columns.len()
                ));
            }
            let cells: Vec<_> = row.iter().map(|value| literal(engine, value.as_deref())).collect();
            values.push(format!("({})", cells.join(", ")));
        }
        let columns: Vec<_> = table.columns.iter().map(|column| quote(engine, &column.name)).collect();
        statements.push(format!(
            "INSERT INTO {} ({}) VALUES {}",
            quote(engine, &table.name),
            columns.join(", "),
            values.join(", ")
        ));
    }
    Ok(statements)
}

/// A table or column name, quoted for the engine.
fn quote(engine: Engine, name: &str) -> String {
    match engine {
        Engine::Mysql => format!("`{}`", name.replace('`', "``")),
        _ => format!("\"{}\"", name.replace('"', "\"\"")),
    }
}

/// A value as a string literal, which both engines turn into the column's
/// type. MySQL also treats backslashes as escapes.
fn literal(engine: Engine, value: Option<&str>) -> String {
    let Some(value) = value else { return "NULL".into() };
    let mut escaped = value.replace('\'', "''");
    if engine == Engine::Mysql {
        escaped = escaped.replace('\\', "\\\\");
    }
    format!("'{escaped}'")
}

/// A type like `INT`, `VARCHAR(50)` or `DECIMAL(4, 1)`: nothing that could
/// end the CREATE TABLE early.
fn is_column_type(sql_type: &str) -> bool {
    !sql_type.trim().is_empty()
        && sql_type.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, ' ' | '_' | '(' | ')' | ','))
}

#[cfg(test)]
mod tests {
    use super::super::{launch, Server};
    use super::*;
    use crate::catalog::{self, Vars};
    use crate::databases::tests::set_up_in;
    use serde_json::json;
    use std::path::PathBuf;

    fn tables() -> Vec<Table> {
        let column = |name: &str, sql_type: &str, primary_key| Column {
            name: name.into(),
            sql_type: sql_type.into(),
            primary_key,
        };
        vec![Table {
            name: "students".into(),
            columns: vec![column("id", "INT", true), column("name", "VARCHAR(50)", false)],
        }]
    }

    fn case(rows: Vec<Vec<Option<&str>>>) -> Case {
        let rows =
            rows.into_iter().map(|row| row.into_iter().map(|v| v.map(String::from)).collect()).collect();
        Case { rows: HashMap::from([("students".to_owned(), rows)]) }
    }

    #[test]
    fn makes_and_fills_the_tables() {
        let case = case(vec![vec![Some("1"), Some("O'Neil")], vec![Some("2"), None]]);
        assert_eq!(
            table_statements(Engine::Mysql, &tables(), &case).unwrap(),
            [
                "CREATE TABLE `students` (`id` INT, `name` VARCHAR(50), PRIMARY KEY (`id`))",
                "INSERT INTO `students` (`id`, `name`) VALUES ('1', 'O''Neil'), ('2', NULL)",
            ]
        );
        assert_eq!(
            table_statements(Engine::Postgres, &tables(), &case).unwrap(),
            [
                "CREATE TABLE \"students\" (\"id\" INT, \"name\" VARCHAR(50), PRIMARY KEY (\"id\"))",
                "INSERT INTO \"students\" (\"id\", \"name\") VALUES ('1', 'O''Neil'), ('2', NULL)",
            ]
        );
    }

    #[test]
    fn escapes_backslashes_only_for_mysql() {
        assert_eq!(literal(Engine::Mysql, Some(r"C:\temp")), r"'C:\\temp'");
        assert_eq!(literal(Engine::Postgres, Some(r"C:\temp")), r"'C:\temp'");
    }

    #[test]
    fn rejects_bad_question_data() {
        let short = case(vec![vec![Some("1")]]);
        assert!(table_statements(Engine::Mysql, &tables(), &short).unwrap_err().contains("1 values, not 2"));
        let stranger = Case { rows: HashMap::from([("teachers".to_owned(), vec![])]) };
        assert!(table_statements(Engine::Mysql, &tables(), &stranger).unwrap_err().contains("teachers"));
        assert!(is_column_type("DECIMAL(4, 1)"));
        assert!(!is_column_type("INT); DROP TABLE x; --"));
        assert!(!is_column_type(""));
    }

    /// A real server on a data folder of its own, from a runtime already
    /// installed (no download). Run with, on a Mac:
    /// PREPCODE_RUNTIMES="$HOME/Library/Application Support/dev.prepcode.desktop/runtimes" \
    ///     cargo test practice -- --ignored
    #[test]
    #[ignore = "needs MySQL and PostgreSQL installed"]
    fn checks_queries_on_real_servers() {
        for extension in ["mysql.sql", "pgsql.sql"] {
            check_on(extension);
        }
    }

    fn check_on(extension: &str) {
        let catalog = catalog::parse(catalog::BUNDLED).unwrap();
        let language = catalog.languages.iter().find(|l| l.extension == extension).unwrap();
        let runtime = catalog.runtimes.iter().find(|r| r.id == language.runtime).unwrap();
        let engine = language.engine.unwrap();
        let runtimes = std::env::var("PREPCODE_RUNTIMES").expect("set PREPCODE_RUNTIMES");
        let root = PathBuf::from(runtimes).join(&runtime.id);
        let exe = root.join(runtime.executable());
        let dir =
            std::env::temp_dir().join(format!("prepcode-practice-{}-{}", runtime.id, std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        let data = dir.join("data");
        set_up_in(&data, language, runtime, &exe, Vars::default().set("runtime", &root)).unwrap();

        let question: Question = serde_json::from_value(json!({
            "tables": [
                { "name": "students", "columns": [
                    { "name": "id", "type": "INT", "primaryKey": true },
                    { "name": "name", "type": "VARCHAR(50)" },
                ] },
                { "name": "marks", "columns": [
                    { "name": "student_id", "type": "INT" },
                    { "name": "subject", "type": "VARCHAR(20)" },
                    { "name": "score", "type": "DECIMAL(4,1)" },
                ] },
            ],
            "cases": [
                { "rows": {
                    "students": [["1", "Aarav"], ["2", "Anu O'Neil"], ["3", null]],
                    "marks": [["1", "Maths", "92"], ["2", "Maths", "85.5"], ["3", "Physics", "99"]],
                } },
                // No marks at all.
                { "rows": { "students": [["1", "Bala"]] } },
            ],
        }))
        .unwrap();

        tauri::async_runtime::block_on(async {
            let vars = Vars::default().set("runtime", &root);
            let (process, mut session) = launch(language, runtime, engine, &exe, &data, vars).await.unwrap();
            let before = session.database().await;
            let servers = Servers::default();
            let check_query = async |query: &str| {
                let runs =
                    check(&session, engine, &question, &split_statements(engine, query), &servers).await;
                serde_json::to_value(runs.unwrap()).unwrap()
            };

            let answer = "SELECT s.name, m.score FROM students s JOIN marks m ON m.student_id = s.id
WHERE m.subject = 'Maths' AND m.score > 80 ORDER BY m.score DESC;";
            assert_eq!(
                check_query(answer).await,
                json!([
                    { "kind": "rows", "columns": ["name", "score"], "rows": [["Aarav", "92.0"], ["Anu O'Neil", "85.5"]] },
                    { "kind": "rows", "columns": ["name", "score"], "rows": [] },
                ]),
                "{extension}"
            );

            // Each case starts fresh: the second CREATE TABLE would fail otherwise.
            let several = "CREATE TABLE extra (x INT);\nINSERT INTO extra VALUES (7);\nSELECT x FROM extra;";
            let ran = check_query(several).await;
            assert_eq!(ran[0], json!({ "kind": "rows", "columns": ["x"], "rows": [["7"]] }), "{extension}");
            assert_eq!(ran[1], ran[0], "{extension}");

            let wrong = check_query("-- a typo\n\nSELECT nme FROM students;").await;
            assert_eq!(
                (wrong[0]["kind"].clone(), wrong[0]["line"].clone()),
                (json!("error"), json!(3)),
                "{wrong}"
            );

            let nothing = check_query("CREATE TABLE t (x INT);").await;
            assert_eq!(
                nothing[0]["message"], "Your query didn't return any rows. End it with a SELECT.",
                "{extension}"
            );

            // Practice used a session of its own and left nothing behind.
            assert_eq!(session.database().await, before, "{extension}");
            let mut results = Vec::new();
            let leftover = match engine {
                Engine::Mysql => format!("SHOW DATABASES LIKE '{DATABASE}'"),
                _ => format!("SELECT 1 FROM pg_namespace WHERE nspname = '{SCHEMA}'"),
            };
            let mut practice = session.open_practice().await.unwrap();
            assert!(practice.run(&Statement::new(0, leftover), &mut results).await.is_ok());
            practice.close().await;
            assert!(
                matches!(&results[0].outcome, Outcome::Table { total: 0, .. }),
                "{extension}: the practice area was left behind"
            );

            let (account, extension) = (String::new(), String::new());
            Server { account, extension, process, session, exe: exe.clone(), data: data.clone() }
                .stop()
                .await;
        });
        let _ = std::fs::remove_dir_all(&dir);
    }
}
