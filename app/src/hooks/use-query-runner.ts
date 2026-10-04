import { useState } from "react";
import { runQueries, stopQueries, summary, type QueryOutput } from "@/lib/sql";

export type QueryResults = {
  /** Counts finished runs, so the panel can start fresh on each one. */
  run: number;
  running: boolean;
  /** The last run's results, if it ran. */
  output: QueryOutput | null;
  /** Why the last run couldn't run at all (e.g. the server didn't start). */
  failure: string | null;
};

/** One row of the Logs: a statement that ran, or why a run stopped. */
export type LogEntry = {
  id: number;
  time: Date;
  file: string;
  /** The statement's line and first line of SQL; null when nothing ran. */
  line: number | null;
  sql: string | null;
  status: "ok" | "error" | "stopped";
  /** E.g. "Query OK, 1 row affected", or the error. */
  message: string;
  /** The server's extra detail, e.g. "Records: 2  Duplicates: 0  Warnings: 0". */
  detail: string | null;
  seconds: number | null;
};

const NO_RESULTS: QueryResults = { run: 0, running: false, output: null, failure: null };
/** Older log rows are dropped past this, so a long session stays quick. */
const MAX_LOGS = 1000;

/** The log rows for one run. */
function logEntries(
  file: string,
  output: QueryOutput | null,
  failure: string | null,
): Omit<LogEntry, "id" | "time">[] {
  const none = { file, line: null, sql: null, detail: null, seconds: null };
  if (!output) return [{ ...none, status: "error", message: failure ?? "Could not run." }];
  const entries: Omit<LogEntry, "id" | "time">[] = output.results.map((result) => ({
    file,
    line: result.line,
    sql: result.sql,
    status: "ok",
    message: summary(result),
    detail: result.kind === "status" && result.info ? result.info : null,
    seconds: result.seconds,
  }));
  if (output.error) {
    const { line, message } = output.error;
    entries.push({ ...none, line, status: "error", message });
  }
  if (output.stopped) entries.push({ ...none, status: "stopped", message: "Stopped." });
  return entries;
}

/**
 * Running the student's database files, one at a time, and the Logs: every
 * statement run since prepcode opened, across files (kept in memory only).
 */
export function useQueryRunner() {
  // Each file keeps the results of its own last run, by filename.
  const [results, setResults] = useState<Partial<Record<string, QueryResults>>>({});
  const [runningFile, setRunningFile] = useState<string | null>(null);
  // Every file runs in the same session, so this is shared. Undefined until
  // the first run connects; null when no database is selected.
  const [database, setDatabase] = useState<string | null>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // Finished runs of any file, so views of the database know to refresh.
  const [runs, setRuns] = useState(0);

  /** Runs the whole file, or only the statement at `line`. */
  async function run(filename: string, line?: number) {
    if (runningFile) return;
    setRunningFile(filename);
    setResults((all) => ({
      ...all,
      [filename]: { ...(all[filename] ?? NO_RESULTS), running: true },
    }));
    let finished: Pick<QueryResults, "output" | "failure">;
    try {
      const output = await runQueries(filename, line);
      setDatabase(output.database);
      finished = { output, failure: null };
    } catch (err) {
      finished = { output: null, failure: String(err) };
    }
    setResults((all) => {
      const previous = all[filename] ?? NO_RESULTS;
      return {
        ...all,
        [filename]: { ...previous, ...finished, running: false, run: previous.run + 1 },
      };
    });
    const time = new Date();
    setLogs((all) => {
      const nextId = (all[all.length - 1]?.id ?? 0) + 1;
      const added = logEntries(filename, finished.output, finished.failure).map((entry, i) => ({
        ...entry,
        id: nextId + i,
        time,
      }));
      return [...all, ...added].slice(-MAX_LOGS);
    });
    setRuns((n) => n + 1);
    setRunningFile(null);
  }

  function stop() {
    stopQueries().catch((err) => console.error("Could not stop the queries:", err));
  }

  return {
    resultsFor: (filename: string) => results[filename] ?? NO_RESULTS,
    database,
    runs,
    logs,
    clearLogs: () => setLogs([]),
    /** Some file is running; only one runs at a time. */
    busy: runningFile !== null,
    run,
    stop,
  };
}
