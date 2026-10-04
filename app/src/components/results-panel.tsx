import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleStopIcon,
  DatabaseIcon,
  EraserIcon,
  PlayIcon,
  TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LogEntry, QueryResults } from "@/hooks/use-query-runner";
import { useDatabaseTablesQuery, useTableRowsQuery } from "@/lib/queries";
import { rowCount, type ResultTable, type StatementResult } from "@/lib/sql";

/** Like the shell's "(0.01 sec)". */
function took(seconds: number) {
  return `(${seconds.toFixed(2)} sec)`;
}

type PanelProps = {
  results: QueryResults;
  /** Undefined until the first run connects; null when none is selected. */
  database: string | null | undefined;
  /** Finished runs of any file; the database's tables refresh on each. */
  runs: number;
  /** Every statement run since prepcode opened, across files. */
  logs: LogEntry[];
  onClearLogs: () => void;
};

/**
 * Under a database file, two tabs: Logs, a row for every statement run since
 * prepcode opened, and Tables, a sub-tab per result with rows from this
 * file's last run, then one per table in the current database. On the right,
 * the database the session is using.
 */
export function ResultsPanel(props: PanelProps) {
  // A fresh set of tabs for each run, opening on the one that matters.
  return <ResultsTabs key={props.results.run} {...props} />;
}

function ResultsTabs({
  results: { running, output, failure },
  database,
  runs,
  logs,
  onClearLogs,
}: PanelProps) {
  const tables = output?.results.filter((r) => r.kind === "table") ?? [];
  const hasError = Boolean(failure || output?.error);
  const [tab, setTab] = useState(hasError || tables.length === 0 ? "logs" : "tables");

  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full min-h-0 gap-0">
      <div className="flex shrink-0 items-center gap-2 border-b px-2">
        <TabsList variant="line">
          <TabsTrigger value="logs">
            Logs
            {hasError && (
              <span className="size-1.5 rounded-full bg-destructive" aria-label="Has an error" />
            )}
          </TabsTrigger>
          <TabsTrigger value="tables">
            Tables{tables.length > 0 && ` (${tables.length})`}
          </TabsTrigger>
        </TabsList>
        {tab === "logs" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            aria-label="Clear logs"
            title="Clear logs"
          >
            <EraserIcon />
          </Button>
        )}
        <div
          className="ml-auto flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
          title="The database your queries run in. USE changes it."
        >
          <DatabaseIcon className="size-3.5 shrink-0" />
          <span className="truncate">
            {database === undefined
              ? "Not connected"
              : database === null
                ? "No database selected"
                : database}
          </span>
        </div>
      </div>

      {running ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Spinner />
          Running…
        </div>
      ) : (
        <>
          <TabsContent value="logs" className="min-h-0">
            <LogsTable logs={logs} />
          </TabsContent>
          <TabsContent value="tables" className="flex min-h-0 flex-col">
            <TablesView results={tables} database={database} runs={runs} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

/**
 * Tab labels: the table's name, "students (2)" when it repeats, or
 * "Result 3" for rows from no table.
 */
function tabLabels(tables: ResultTable[]) {
  const seen = new Map<string, number>();
  return tables.map((table, i) => {
    if (!table.name) return `Result ${i + 1}`;
    const count = (seen.get(table.name) ?? 0) + 1;
    seen.set(table.name, count);
    return count === 1 ? table.name : `${table.name} (${count})`;
  });
}

/**
 * A sub-tab per result with rows from the last run, then one per table in the
 * current database, to look at without writing a SELECT.
 */
function TablesView({
  results,
  database,
  runs,
}: {
  results: ResultTable[];
  database: string | null | undefined;
  runs: number;
}) {
  const databaseTables = useDatabaseTablesQuery(database, runs);
  const names = databaseTables.data ?? [];
  const labels = tabLabels(results);

  if (results.length === 0 && names.length === 0) {
    let hint = "Run your queries to see your tables here.";
    if (database === null) hint = "No database selected. Run USE your_database; to see its tables.";
    else if (database && databaseTables.isPending) return <Loading />;
    else if (databaseTables.isError) hint = String(databaseTables.error);
    else if (database) hint = `No tables in ${database} yet.`;
    return (
      <div className="p-4">
        <Hint>{hint}</Hint>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue={results.length > 0 ? "result-0" : `table-${names[0]}`}
      className="min-h-0 flex-1 gap-0"
    >
      <div className="shrink-0 overflow-x-auto border-b px-2">
        <TabsList variant="line">
          {results.map((table, i) => (
            <TabsTrigger key={i} value={`result-${i}`} title={`Line ${table.line}: ${table.sql}`}>
              <PlayIcon className="size-3" />
              <span className="max-w-48 truncate">{labels[i]}</span>
            </TabsTrigger>
          ))}
          {results.length > 0 && names.length > 0 && (
            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-4 data-vertical:self-auto"
            />
          )}
          {names.map((name) => (
            <TabsTrigger key={name} value={`table-${name}`} title={`${database}.${name}`}>
              <TableIcon className="size-3" />
              <span className="max-w-48 truncate">{name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {results.map((table, i) => (
        <TabsContent key={i} value={`result-${i}`} className="min-h-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1.5 p-4">
              <StatementLine result={table} />
              <ResultGrid table={table} />
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
      {database &&
        names.map((name) => (
          <TabsContent key={name} value={`table-${name}`} className="min-h-0">
            <DatabaseTable database={database} name={name} runs={runs} />
          </TabsContent>
        ))}
    </Tabs>
  );
}

/** All of one table's rows, read when its tab opens. */
function DatabaseTable({ database, name, runs }: { database: string; name: string; runs: number }) {
  const rows = useTableRowsQuery(database, name, runs);
  if (rows.isPending) return <Loading />;
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1.5 p-4">
        {rows.isError ? (
          <p className="text-xs text-destructive">{String(rows.error)}</p>
        ) : (
          <ResultGrid table={rows.data} />
        )}
      </div>
    </ScrollArea>
  );
}

function Loading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
      <Spinner />
      Loading…
    </div>
  );
}

/** "Line 5  SELECT * FROM students". */
function StatementLine({ result }: { result: StatementResult }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground">Line {result.line}</span>
      <code className="truncate font-mono" title={result.sql}>
        {result.sql}
      </code>
    </div>
  );
}

const LOG_ICONS = {
  ok: <CircleCheckIcon className="size-3.5 text-primary" aria-label="Done" />,
  error: <CircleAlertIcon className="size-3.5 text-destructive" aria-label="Error" />,
  stopped: <CircleStopIcon className="size-3.5 text-muted-foreground" aria-label="Stopped" />,
};

/** Every statement run since prepcode opened, newest at the bottom. */
function LogsTable({ logs }: { logs: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  // Keep the newest rows in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="p-4">
        <Hint>Run your queries to see the results here.</Hint>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="w-10">#</TableHead>
            <TableHead className="w-20">Time</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="w-12">Line</TableHead>
            <TableHead>Statement</TableHead>
            <TableHead>Response</TableHead>
            <TableHead className="w-20 text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{LOG_ICONS[entry.status]}</TableCell>
              <TableCell className="text-muted-foreground">{entry.id}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(entry.time, "HH:mm:ss")}
              </TableCell>
              <TableCell className="max-w-40 truncate" title={entry.file}>
                {entry.file}
              </TableCell>
              <TableCell>{entry.line ?? ""}</TableCell>
              <TableCell className="max-w-72 truncate" title={entry.sql ?? undefined}>
                {entry.sql ?? ""}
              </TableCell>
              {/* Errors wrap, so the whole message can be read. */}
              <TableCell
                className={
                  entry.status === "error"
                    ? "min-w-64 whitespace-normal break-words text-destructive"
                    : undefined
                }
              >
                {entry.message}
                {entry.detail && (
                  <span className="block text-muted-foreground">{entry.detail}</span>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {entry.seconds === null ? "" : `${entry.seconds.toFixed(3)} sec`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={endRef} />
    </ScrollArea>
  );
}

function ResultGrid({ table }: { table: ResultTable }) {
  const shown = table.rows.length;
  if (table.total === 0) {
    return <Hint>Empty set {took(table.seconds)}</Hint>;
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {table.columns.map((column, i) => (
              <TableHead key={i}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((value, c) => (
                // Long values are cut off; hovering shows them in full.
                <TableCell key={c} className="max-w-96 truncate" title={value ?? "NULL"}>
                  {value ?? <span className="text-muted-foreground italic">NULL</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Hint>
        {rowCount(table.total)} in set {took(table.seconds)}
        {shown < table.total && ` (showing the first ${shown.toLocaleString()})`}
      </Hint>
    </>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
