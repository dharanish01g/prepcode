import { useEffect, useRef, useState } from "react";
import { EraserIcon, TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { ConsoleEntry } from "@/hooks/use-runner";
import { cn } from "@/lib/utils";

const ENTRY_STYLES: Record<ConsoleEntry["kind"], string> = {
  stdout: "",
  stderr: "text-destructive",
  input: "text-primary",
  status: "text-muted-foreground",
  error: "text-destructive",
};

export function ConsolePanel({
  entries,
  loading,
  running,
  acceptingInput,
  onSend,
  onClear,
}: {
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
                const ownLine = entry.kind === "status" || entry.kind === "error";
                const previous = entries[i - 1];
                const needsBreak = ownLine && previous && !previous.text.endsWith("\n");
                return (
                  <span key={i} className={cn(ENTRY_STYLES[entry.kind], ownLine && "italic")}>
                    {needsBreak && "\n"}
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
    </div>
  );
}
