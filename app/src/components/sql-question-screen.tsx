import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { usePanelRef } from "react-resizable-panels";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  LockIcon,
  Maximize2Icon,
  Minimize2Icon,
  PlayIcon,
  RotateCcwIcon,
  SendIcon,
} from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
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
import { useIsDark } from "@/hooks/use-theme";
import { celebrate } from "@/lib/celebrate";
import { getLanguages, type Language } from "@/lib/languages";
import {
  blockClipboard,
  EDITOR_FONT_SIZE,
  EDITOR_PADDING,
  editorModelPath,
  NO_CLIPBOARD_OPTIONS,
} from "@/lib/monaco";
import { rowCount, stopQueries } from "@/lib/sql";
import {
  checkSqlPractice,
  compareRows,
  sqlStarter,
  type SqlQuestion,
  type SqlRow,
  type SqlRun,
  type SqlTestCase,
  type SqlVerdict,
} from "@/lib/sql-questions";
import { useInstalledRuntimes } from "@/lib/runtimes";
import { cn } from "@/lib/utils";

type MonacoEditor = Parameters<OnMount>[0];

/** Like Run and Submit on coding questions: never a flash of the loader. */
const MIN_CHECK_MS = 1000;

/** How the query did on one test case. */
type CaseOutcome = {
  /** e.g. "Case 2", or "Hidden 1". */
  label: string;
  testCase: SqlTestCase;
  run: SqlRun;
  /** null when the query failed with an error. */
  verdict: SqlVerdict | null;
};

/** Where a Run (the examples) or a Submit (every case) is. */
type SqlCheck =
  | { status: "checking"; kind: "run" | "submit" }
  /** It couldn't check at all, e.g. the database didn't start. */
  | { status: "error"; message: string }
  | { status: "done"; kind: "run" | "submit"; outcomes: CaseOutcome[]; finishedAt: number };

/** Examples count from 1, then hidden cases from 1. */
function caseLabels(cases: SqlTestCase[]) {
  let examples = 0;
  let hidden = 0;
  return cases.map((testCase) =>
    testCase.visibility === "example" ? `Case ${++examples}` : `Hidden ${++hidden}`,
  );
}

function passedCount(check: SqlCheck | undefined) {
  if (check?.status !== "done") return null;
  const passed = check.outcomes.filter((outcome) => outcome.verdict?.passed).length;
  return { passed, total: check.outcomes.length };
}

/**
 * A SQL question being solved, one at a time. The questions are listed in
 * the sidebar; previous/next step through them in the header.
 */
export function SqlQuestionScreen({
  userId,
  questions,
  selectedQuestion,
  onSelectQuestion,
}: {
  userId: string;
  questions: SqlQuestion[];
  selectedQuestion: string | null;
  onSelectQuestion: (slug: string) => void;
}) {
  const index = questions.findIndex((q) => q.slug === selectedQuestion);
  const question = index >= 0 ? questions[index] : undefined;
  const previous = index > 0 ? questions[index - 1] : undefined;
  const next = index >= 0 ? questions[index + 1] : undefined;
  const runtimes = useInstalledRuntimes();
  const engines = getLanguages("database");
  const installed = engines.filter((lang) => runtimes.data?.includes(lang.extension));
  const notInstalled = engines.filter((lang) => !runtimes.data?.includes(lang.extension));
  const [pickedExtension, setPickedExtension] = useState<string | null>(null);
  // Kept across questions, like the language on coding questions.
  const engine =
    installed.find((lang) => lang.extension === pickedExtension) ?? installed[0] ?? null;
  const checkKey = question && engine ? `${question.slug}.${engine.extension}` : null;
  const [checks, setChecks] = useState<Partial<Record<string, SqlCheck>>>({});
  const editorRef = useRef<MonacoEditor | null>(null);
  const check = checkKey ? checks[checkKey] : undefined;
  const checking = Object.values(checks).some((state) => state?.status === "checking");

  /**
   * Run checks the examples, Submit every case. For now it pretends to run:
   * each case is set up fresh on the student's own server, and the query
   * runs on it.
   */
  async function handleCheck(kind: "run" | "submit") {
    if (!question || !engine || !checkKey) return;
    const setCheck = (state: SqlCheck) => setChecks((prev) => ({ ...prev, [checkKey]: state }));
    const query = editorRef.current?.getValue() ?? "";
    setCheck({ status: "checking", kind });
    // Every Run and Submit loads for at least this long, however it ends.
    const minimum = new Promise((resolve) => setTimeout(resolve, MIN_CHECK_MS));
    const labels = caseLabels(question.cases);
    const chosen = question.cases
      .map((testCase, i) => ({ testCase, label: labels[i] }))
      .filter(({ testCase }) => kind === "submit" || testCase.visibility === "example");
    try {
      const runs = await checkSqlPractice(
        engine.extension,
        question,
        chosen.map(({ testCase }) => testCase),
        query,
      );
      await minimum;
      const outcomes = chosen.map(({ testCase, label }, i): CaseOutcome => {
        const run = runs[i];
        const verdict =
          run.kind === "rows" ? compareRows(run, testCase.expected, question.ordered) : null;
        return { label, testCase, run, verdict };
      });
      setCheck({ status: "done", kind, outcomes, finishedAt: Date.now() });
      if (outcomes.every((outcome) => outcome.verdict?.passed)) celebrate();
    } catch (err) {
      await minimum;
      setCheck({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        {/* Three columns, so the question number stays centred. */}
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>SQL</BreadcrumbItem>
              {question && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{question.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <Badge variant="outline" title="Sample questions, not in Practice yet">
            Preview
          </Badge>
        </div>
        {question && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!previous}
              onClick={() => previous && onSelectQuestion(previous.slug)}
              aria-label="Previous question"
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-14 text-center text-sm tabular-nums">
              {index + 1} / {questions.length}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!next}
              onClick={() => next && onSelectQuestion(next.slug)}
              aria-label="Next question"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
        <div className="flex flex-1 basis-0 items-center justify-end gap-2">
          {question &&
            (checking ? (
              // One check runs at a time, so Stop ends whichever is going.
              <Button variant="destructive" onClick={() => void stopQueries()}>
                <Spinner />
                Stop
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={!engine}
                  onClick={() => handleCheck("run")}
                  title="Check your query on the example cases"
                >
                  <PlayIcon />
                  Run
                </Button>
                <Button
                  disabled={!engine}
                  onClick={() => handleCheck("submit")}
                  title="Check your query on every case, hidden ones too"
                >
                  <SendIcon />
                  Submit
                </Button>
              </>
            ))}
        </div>
      </header>
      {question ? (
        // Keyed so each question opens fresh.
        <SqlQuestionView
          key={question.slug}
          userId={userId}
          question={question}
          engine={engine}
          check={check}
          editorRef={editorRef}
          enginePicker={
            <LanguagePicker
              installed={installed}
              notInstalled={notInstalled}
              value={engine}
              onPick={setPickedExtension}
              disabled={runtimes.isPending}
            />
          }
        />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
    </>
  );
}

/** The question's share of the width, beside the query. */
function questionSize(sidebarOpen: boolean) {
  return sidebarOpen ? "50%" : "40%";
}

/**
 * The question and its example cases on the left, the query on the right,
 * with Run's and Submit's results below it. Full screen leaves just the query.
 */
function SqlQuestionView({
  userId,
  question,
  engine,
  check,
  editorRef,
  enginePicker,
}: {
  userId: string;
  question: SqlQuestion;
  /** The picked database; null until one is installed. */
  engine: Language | null;
  check: SqlCheck | undefined;
  /** Set to the query's editor, which Run and Submit read. */
  editorRef: React.RefObject<MonacoEditor | null>;
  /** Shown in the bar above the editor: the database the query runs on. */
  enginePicker: React.ReactNode;
}) {
  const { open: sidebarOpen } = useSidebar();
  const questionPanel = usePanelRef();
  const resultPanel = usePanelRef();
  const [fullScreen, setFullScreen] = useState(false);
  const updateFullScreen = useCallback(() => {
    setFullScreen(
      Boolean(questionPanel.current?.isCollapsed() && resultPanel.current?.isCollapsed()),
    );
  }, [questionPanel, resultPanel]);

  useEffect(() => {
    if (questionPanel.current?.isCollapsed()) return;
    questionPanel.current?.resize(questionSize(sidebarOpen));
  }, [sidebarOpen, questionPanel]);

  const checking = check?.status === "checking";
  useEffect(() => {
    if (checking) resultPanel.current?.expand();
  }, [checking, resultPanel]);

  function toggleFullScreen() {
    for (const panel of [questionPanel, resultPanel]) {
      if (fullScreen) panel.current?.expand();
      else panel.current?.collapse();
    }
  }

  // One edit, so Ctrl/Cmd+Z brings the query back.
  function reset() {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    editor.pushUndoStop();
    const starter = sqlStarter(question);
    editor.executeEdits("reset", [{ range: model.getFullModelRange(), text: starter }]);
    editor.pushUndoStop();
    editor.setPosition(model.getPositionAt(starter.length));
    editor.focus();
  }

  const count = passedCount(check);
  const examples = question.cases.filter((testCase) => testCase.visibility === "example");
  const hidden = question.cases.length - examples.length;

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel
        id="question"
        panelRef={questionPanel}
        defaultSize={questionSize(sidebarOpen)}
        minSize="25%"
        collapsible
        collapsedSize="0%"
        onResize={updateFullScreen}
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h1 className="mb-3 text-base font-semibold">{question.title}</h1>
              <Markdown>{question.description}</Markdown>
            </div>
            <CompactMarkdown>{schemaMarkdown(question)}</CompactMarkdown>
            <Tabs defaultValue="0" className="gap-4">
              <TabsList variant="line">
                {examples.map((_, i) => (
                  <TabsTrigger key={i} value={String(i)}>
                    Example {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              {examples.map((testCase, i) => (
                <TabsContent key={i} value={String(i)} className="flex flex-col gap-6">
                  <CompactMarkdown>{exampleMarkdown(question, testCase)}</CompactMarkdown>
                </TabsContent>
              ))}
            </Tabs>
            <p className="text-sm text-muted-foreground">
              {question.ordered ? "Rows must be in the order shown." : "Rows can be in any order."}{" "}
              Column names don't need to match. Run checks the {countOf(examples.length, "example")}
              {hidden > 0 && `; Submit also checks ${countOf(hidden, "hidden case")}`}.
            </p>
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />

      <ResizablePanel id="query" minSize="30%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel id="editor" defaultSize="55%" minSize="20%">
            <div className="flex h-full flex-col">
              {/* The editor's bar: its database, Reset and full screen. */}
              <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
                {enginePicker}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  disabled={!engine}
                  onClick={reset}
                >
                  <RotateCcwIcon />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleFullScreen}
                  aria-label={fullScreen ? "Exit full screen" : "Full screen"}
                  title={fullScreen ? "Exit full screen" : "Full screen"}
                >
                  {fullScreen ? <Minimize2Icon /> : <Maximize2Icon />}
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                {engine ? (
                  <QueryEditor
                    key={engine.extension}
                    userId={userId}
                    question={question}
                    engine={engine}
                    editorRef={editorRef}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    Download a database from the list above to start.
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="result"
            panelRef={resultPanel}
            defaultSize="45%"
            minSize="10%"
            collapsible
            collapsedSize="0%"
            onResize={updateFullScreen}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-9 shrink-0 items-center border-b px-4 text-xs font-medium">
                Results
                {count && check?.status === "done" && (
                  <span
                    className={cn(
                      "ml-auto tabular-nums",
                      count.passed === count.total
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {check.kind === "submit" &&
                      (count.passed === count.total ? "Accepted · " : "Wrong answer · ")}
                    {count.passed}/{count.total} passed
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <CheckResults check={check} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** "1 example", "2 hidden cases". */
function countOf(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Questions will be written in markdown, so the preview builds theirs from
 * the dummy data: the tables' columns, then each example's rows.
 */
function markdownTable(columns: string[], rows: SqlRow[]) {
  const cell = (value: string | null) => (value === null ? "*NULL*" : value.replace(/\|/g, "\\|"));
  const lines = [
    `| ${columns.join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ];
  return rows.length === 0 ? `${lines.join("\n")}\n\n*No rows.*` : lines.join("\n");
}

/** Each table's columns, LeetCode style. */
function schemaMarkdown(question: SqlQuestion) {
  return question.tables
    .map(
      (table) =>
        `**${table.name}**\n\n` +
        markdownTable(
          ["Column", "Type"],
          table.columns.map((column) => [
            column.name,
            column.primaryKey ? `${column.type} (primary key)` : column.type,
          ]),
        ),
    )
    .join("\n\n");
}

/** An example case: its tables' rows, then what the query should return on them. */
function exampleMarkdown(question: SqlQuestion, testCase: SqlTestCase) {
  return [
    ...question.tables.map(
      (table) =>
        `**${table.name}**\n\n` +
        markdownTable(
          table.columns.map((column) => column.name),
          testCase.rows[table.name] ?? [],
        ),
    ),
    "**Expected output**\n\n" + markdownTable(testCase.expected.columns, testCase.expected.rows),
  ].join("\n\n");
}

/** Markdown with its tables only as wide as their content. */
function CompactMarkdown({ children }: { children: string }) {
  return (
    <div className="[&_table]:w-auto">
      <Markdown>{children}</Markdown>
    </div>
  );
}

/**
 * The query editor for a question on one database. Not saved yet: the text
 * stays in its editor model until logout.
 */
function QueryEditor({
  userId,
  question,
  engine,
  editorRef,
}: {
  userId: string;
  question: SqlQuestion;
  engine: Language;
  editorRef: React.RefObject<MonacoEditor | null>;
}) {
  const isDark = useIsDark();
  return (
    <Editor
      path={editorModelPath(userId, `sql-preview/${question.slug}.${engine.extension}`)}
      defaultValue={sqlStarter(question)}
      language={engine.monaco}
      keepCurrentModel
      theme={isDark ? "vs-dark" : "light"}
      loading={null}
      onMount={(editor) => {
        editorRef.current = editor;
        blockClipboard(editor);
      }}
      options={{
        ...NO_CLIPBOARD_OPTIONS,
        fontSize: EDITOR_FONT_SIZE,
        padding: EDITOR_PADDING,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  );
}

/**
 * The last Run's or Submit's cases, a tab each with a tick or a cross. It
 * opens on the first case that failed.
 */
function CheckResults({ check }: { check: SqlCheck | undefined }) {
  if (!check) {
    return <Message>Run your query on the examples, or submit it to check every case.</Message>;
  }
  if (check.status === "error") {
    return (
      <Message>
        <span className="text-destructive">{check.message}</span>
      </Message>
    );
  }
  if (check.status === "checking") {
    return (
      <Message>
        <Spinner />
        {check.kind === "submit" ? "Checking every case…" : "Running the examples…"}
      </Message>
    );
  }
  const { outcomes, finishedAt } = check;
  const firstFailed = outcomes.findIndex((outcome) => !outcome.verdict?.passed);
  return (
    <Tabs
      // A fresh set of tabs for each check, opening on the one that matters.
      key={finishedAt}
      defaultValue={String(Math.max(firstFailed, 0))}
      className="min-h-0 flex-1 gap-0"
    >
      <div className="shrink-0 overflow-x-auto border-b px-2">
        <TabsList variant="line">
          {outcomes.map((outcome, i) => (
            <TabsTrigger key={outcome.label} value={String(i)}>
              {outcome.verdict?.passed ? (
                <CircleCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CircleXIcon className="size-3.5 text-destructive" />
              )}
              {outcome.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {outcomes.map((outcome, i) => (
        <TabsContent key={outcome.label} value={String(i)} className="min-h-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-4 text-sm">
              <CaseResult outcome={outcome} />
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * One case: its error, or whether its rows match. A wrong example shows both
 * results side by side; a hidden case never shows its rows.
 */
function CaseResult({ outcome: { testCase, run, verdict } }: { outcome: CaseOutcome }) {
  const hidden = testCase.visibility === "hidden";
  if (run.kind === "error") {
    return (
      <>
        <p className="font-medium text-destructive">Your query failed on line {run.line}.</p>
        <p className="font-mono text-[0.8125rem] break-words text-destructive">{run.message}</p>
      </>
    );
  }
  if (!verdict) return null;
  return (
    <>
      <div>
        <p
          className={cn(
            "font-medium",
            verdict.passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {verdict.passed ? "Passed" : "Wrong result"}
        </p>
        <p className="text-muted-foreground">
          {verdict.passed ? "Your result matches the expected output." : verdict.reason}
        </p>
      </div>
      {hidden ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <LockIcon className="size-3.5" />
          This is a hidden case, so its rows aren't shown.
        </p>
      ) : verdict.passed ? (
        <>
          <RowsTable columns={run.columns} rows={run.rows} />
          <p className="text-xs text-muted-foreground">
            {run.rows.length === 0 ? "Empty set" : `${rowCount(run.rows.length)} in set`}
          </p>
        </>
      ) : (
        // Side by side, with the rows that differ marked.
        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="text-xs text-muted-foreground">Your result</h3>
            <RowsTable columns={run.columns} rows={run.rows} marked={verdict.wrongRows} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="text-xs text-muted-foreground">Expected</h3>
            <RowsTable
              columns={testCase.expected.columns}
              rows={testCase.expected.rows}
              marked={verdict.missingRows}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** Rows under their columns, as wide as they need. Marked rows (by index) differ from the expected. */
function RowsTable({
  columns,
  rows,
  marked,
}: {
  columns: string[];
  rows: SqlRow[];
  marked?: ReadonlySet<number>;
}) {
  return (
    <div className="w-fit max-w-full border">
      <Table className="w-auto text-sm">
        <TableHeader>
          <TableRow>
            {columns.map((column, i) => (
              <TableHead key={i}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-muted-foreground">
                No rows
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, r) => (
              <TableRow key={r} className={cn(marked?.has(r) && "bg-destructive/10")}>
                {row.map((value, c) => (
                  <TableCell key={c} className="max-w-96 truncate" title={value ?? "NULL"}>
                    {value ?? <span className="text-muted-foreground italic">NULL</span>}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
      {children}
    </div>
  );
}
