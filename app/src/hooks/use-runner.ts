import { useCallback, useEffect, useRef, useState } from "react";
import { runProgram, sendInput, stopProgram, type RunEvent } from "@/lib/run";

export type ConsoleEntry = {
  kind: "stdout" | "stderr" | "input" | "status" | "error";
  text: string;
};

/** Oldest output is dropped past this, so a runaway loop can't freeze the app. */
const MAX_CONSOLE_CHARS = 200_000;

/**
 * Programs can't tell us when they're waiting for input, so the input box
 * appears once the program prints normal output (e.g. a prompt) or has been
 * running this long. Showing it immediately made it flash for programs that
 * fail right away, like Java compile errors (which go to stderr).
 */
const SHOW_INPUT_AFTER_MS = 1500;

/** Message for how a run ended, or null for a normal finish (nothing to say). */
function exitMessage(event: Extract<RunEvent, { type: "exit" }>) {
  if (event.stopped) return "Program stopped.";
  if (event.stage === "compile") return "Compilation failed. Fix the errors above and run again.";
  if (event.code === 0) return null;
  return event.code === null
    ? "Program ended unexpectedly."
    : `Program exited with code ${event.code}.`;
}

function append(entries: ConsoleEntry[], added: ConsoleEntry[]) {
  const next = [...entries];
  for (const entry of added) {
    const last = next[next.length - 1];
    // Merge consecutive output of the same kind to keep the list short.
    if (last && last.kind === entry.kind && (entry.kind === "stdout" || entry.kind === "stderr")) {
      next[next.length - 1] = { ...last, text: last.text + entry.text };
    } else {
      next.push(entry);
    }
  }

  let total = next.reduce((sum, e) => sum + e.text.length, 0);
  while (total > MAX_CONSOLE_CHARS && next.length > 1) {
    total -= next.shift()!.text.length;
  }
  if (total > MAX_CONSOLE_CHARS) {
    next[0] = { ...next[0], text: next[0].text.slice(total - MAX_CONSOLE_CHARS) };
  }
  return next;
}

/** Console state for running the student's programs, one at a time. */
export function useRunner() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [acceptingInput, setAcceptingInput] = useState(false);
  const inputTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Events from a previous run are ignored once a new run starts.
  const runToken = useRef(0);
  // Output arrives in bursts; apply it once per animation frame.
  const buffered = useRef<ConsoleEntry[]>([]);
  const frame = useRef<number | null>(null);

  const push = useCallback((entry: ConsoleEntry) => {
    buffered.current.push(entry);
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const added = buffered.current;
      buffered.current = [];
      setEntries((prev) => append(prev, added));
    });
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      clearTimeout(inputTimer.current);
    },
    [],
  );

  const run = useCallback(
    async (filename: string) => {
      const token = ++runToken.current;
      buffered.current = [];
      setEntries([]);
      setRunning(true);
      setAcceptingInput(false);
      clearTimeout(inputTimer.current);
      let started = false;

      const onEvent = (event: RunEvent) => {
        if (token !== runToken.current) return;
        if (event.type === "started") {
          started = true;
          inputTimer.current = setTimeout(() => {
            if (token === runToken.current) setAcceptingInput(true);
          }, SHOW_INPUT_AFTER_MS);
        } else if (event.type === "output") {
          push({ kind: event.stream, text: event.text });
          if (started && event.stream === "stdout") setAcceptingInput(true);
        } else {
          const message = exitMessage(event);
          if (message) push({ kind: event.stopped ? "status" : "error", text: message });
        }
      };

      try {
        await runProgram(filename, onEvent);
      } catch (err) {
        if (token === runToken.current) push({ kind: "error", text: String(err) });
      } finally {
        if (token === runToken.current) {
          clearTimeout(inputTimer.current);
          setAcceptingInput(false);
          setRunning(false);
        }
      }
    },
    [push],
  );

  const send = useCallback(
    (line: string) => {
      // Programs don't echo piped input, so show what the student typed.
      push({ kind: "input", text: `${line}\n` });
      sendInput(`${line}\n`).catch((err) => push({ kind: "error", text: String(err) }));
    },
    [push],
  );

  const stop = useCallback(() => {
    stopProgram().catch((err) => push({ kind: "error", text: String(err) }));
  }, [push]);

  const clear = useCallback(() => {
    buffered.current = [];
    setEntries([]);
  }, []);

  return { entries, running, acceptingInput, run, send, stop, clear };
}
