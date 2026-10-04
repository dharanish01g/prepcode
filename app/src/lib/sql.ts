import { invoke } from "@tauri-apps/api/core";

/** One statement's result. Mirrors StatementResult in src-tauri/src/sql.rs. */
export type StatementResult = {
  /** Line where the statement starts. */
  line: number;
  /** The statement's first line. */
  sql: string;
  /** How long it took, shown like the shell's "(0.01 sec)". */
  seconds: number;
} & (
  | {
      /** Rows (SELECT, SHOW, …). */
      kind: "table";
      /**
       * The tables the rows come from ("students", "students, marks"), or the
       * command for SHOW/DESCRIBE/EXPLAIN; null for rows from no table.
       */
      name: string | null;
      columns: string[];
      /** At most 1,000 rows; null is SQL NULL. */
      rows: (string | null)[][];
      /** How many rows the statement returned. */
      total: number;
    }
  | {
      /** No rows (INSERT, CREATE, …). */
      kind: "status";
      affected: number;
      warnings: number;
      /** The server's extra detail, e.g. "Records: 2  Duplicates: 0  Warnings: 0". */
      info: string;
      /** A USE: the shell says "Database changed". */
      databaseChanged: boolean;
    }
);

export type ResultTable = Extract<StatementResult, { kind: "table" }>;

/** What a run shows. Mirrors QueryOutput in src-tauri/src/sql.rs. */
export type QueryOutput = {
  /** In order: one per statement, or more for a procedure that returns several. */
  results: StatementResult[];
  /** The error that stopped the file; the statements before it still ran. */
  error: { line: number; message: string } | null;
  /** Stop interrupted the file. */
  stopped: boolean;
  /** The session's current database after the run (USE changes it). */
  database: string | null;
};

/** "1 row", "2 rows". */
export function rowCount(n: number) {
  return n === 1 ? "1 row" : `${n.toLocaleString()} rows`;
}

/** How a statement went, as the `mysql` shell says it, e.g. "Query OK, 1 row affected". */
export function summary(result: StatementResult) {
  if (result.kind === "table") {
    return result.total === 0 ? "Empty set" : `${rowCount(result.total)} in set`;
  }
  if (result.databaseChanged) return "Database changed";
  const warnings =
    result.warnings > 0 ? `, ${result.warnings} warning${result.warnings === 1 ? "" : "s"}` : "";
  return `Query OK, ${rowCount(result.affected)} affected${warnings}`;
}

/**
 * Runs a database file on the student's own server (started on the first
 * run), or given the cursor's line, only the statement there. Rejects with a
 * user-facing message if it couldn't run at all.
 */
export function runQueries(filename: string, line?: number) {
  return invoke<QueryOutput>("run_queries", { filename, line: line ?? null });
}

export function stopQueries() {
  return invoke<void>("stop_queries");
}

/** The tables in the session's current database; null before the first run or with no database selected. */
export function listTables() {
  return invoke<string[] | null>("list_tables");
}

/** A table's rows (at most 1,000 shown), from the session's current database. */
export function tableRows(table: string) {
  return invoke<ResultTable>("table_rows", { table });
}
