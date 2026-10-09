import { useEffect, useRef, useState } from "react";
import { CircleCheckIcon, CircleXIcon, EraserIcon, SquareIcon, TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { ConsoleEntry, RunSummary } from "@/hooks/use-runner";
import { describeRunEnd } from "@/lib/run";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-destructive",
};

const TONE_ICONS = { success: CircleCheckIcon, warning: SquareIcon, error: CircleXIcon };

const ENTRY_STYLES: Record<ConsoleEntry["kind"], string> = {
  stdout: "",
  stderr: "text-destructive",
  input: "text-primary",
  success: TONE_STYLES.success,
  warning: TONE_STYLES.warning,
  error: TONE_STYLES.error,
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function FooterSeparator() {
  return <Separator orientation="vertical" className="data-vertical:h-3 data-vertical:self-auto" />;
}

/** One line under the console: which file ran, when, for how long, and how it ended. */
function RunFooter({ filename, summary }: { filename: string; summary: RunSummary }) {
  const time = new Date(summary.startedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  const end = summary.end && describeRunEnd(summary.end);
  const Icon = end && TONE_ICONS[end.tone];
  return (
    <div className="flex shrink-0 items-center gap-3 border-t px-4 py-1 text-xs text-muted-foreground">
      {end && Icon ? (
        <span
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 font-medium",
            TONE_STYLES[end.tone],
          )}
        >
          <Icon className="size-3.5" />
          {end.label}
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-primary">
          <Spinner className="size-3.5" />
          Running
        </span>
      )}
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-foreground">{filename}</span>
        {summary.endedAt !== null && (
          <>
            <FooterSeparator />
            {/* Compiling and running together, from pressing Run to the end. */}
            <span className="shrink-0">
              took{" "}
              <span className="font-medium text-foreground">
                {formatDuration(summary.endedAt - summary.startedAt)}
              </span>
            </span>
          </>
        )}
        <FooterSeparator />
        <span className="shrink-0">
          {end ? "ran" : "started"} at <span className="text-foreground">{time}</span>
        </span>
      </div>
    </div>
  );
}

export function ConsolePanel({
  filename,
  summary,
  entries,
  loading,
  running,
  acceptingInput,
  onSend,
  onClear,
}: {
  /** The program this console belongs to. */
  filename: string;
  /** Its last run, or null if it hasn't been run yet. */
  summary: RunSummary | null;
  entries: ConsoleEntry[];
  /** A run just started: show a loader instead of the (held back) output. */
  loading: boolean;
  /** The program is still running (shown once the loader is gone). */
  running: boolean;
  /** Show the input box (the program is running and plausibly reading input). */
  acceptingInput: boolean;
  onSend: (line: string) => void;
  onClear: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest output in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  // Ready for typing as soon as the input box appears.
  useEffect(() => {
    if (acceptingInput) inputRef.current?.focus();
    else setInput("");
  }, [acceptingInput]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-1 text-xs font-medium text-muted-foreground">
        <TerminalIcon className="size-3.5" />
        Console
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto"
          onClick={onClear}
          disabled={loading || entries.length === 0}
          aria-label="Clear console"
        >
          <EraserIcon />
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Spinner />
          Running…
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <pre className="p-4 font-mono text-xs break-words whitespace-pre-wrap">
            {entries.length === 0 ? (
              <span className="text-muted-foreground">
                {running
                  ? "Your program is running but hasn't printed anything. If it's waiting for input, type it below."
                  : "Run your program to see its output here."}
              </span>
            ) : (
              entries.map((entry, i) => {
                // prepcode's own messages always start on a fresh line.
                const ownLine =
                  entry.kind !== "stdout" && entry.kind !== "stderr" && entry.kind !== "input";
                const previous = entries[i - 1];
                const needsBreak = ownLine && previous && !previous.text.endsWith("\n");
                // A blank line sets the run's result apart from the program's output.
                const gap = entry.result && previous ? "\n" : "";
                return (
                  <span key={i} className={cn(ENTRY_STYLES[entry.kind], ownLine && "italic")}>
                    {needsBreak && "\n"}
                    {gap}
                    {entry.text}
                    {ownLine && "\n"}
                  </span>
                );
              })
            )}
            <div ref={endRef} />
          </pre>
        </ScrollArea>
      )}

      {acceptingInput && !loading && (
        <form
          className="shrink-0 border-t p-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSend(input);
            setInput("");
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Type input for your program and press Enter"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </form>
      )}

      {summary && <RunFooter filename={filename} summary={summary} />}
    </div>
  );
}
