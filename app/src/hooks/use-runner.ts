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

/**
 * Each run shows a loader for at least this long, holding back output and the
 * input box meanwhile. Otherwise the console flickers: the empty-console
 * hint, then the input box for a program that's already done, then output.
 */
const MIN_LOADING_MS = 400;

/** Console state for running the student's programs, one at a time. */
export function useRunner() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptingInput, setAcceptingInput] = useState(false);
  const inputTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Events from a previous run are ignored once a new run starts.
  const runToken = useRef(0);
  // Output arrives in bursts; apply it once per animation frame.
  const buffered = useRef<ConsoleEntry[]>([]);
  const frame = useRef<number | null>(null);
  // While the loader shows, output only collects in `buffered`, and a wish to
  // show the input box waits here (cleared if the program ends first).
  const holding = useRef(false);
  const inputWanted = useRef(false);

  const flush = useCallback(() => {
    if (holding.current || frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const added = buffered.current;
      buffered.current = [];
      setEntries((prev) => append(prev, added));
    });
  }, []);

  const push = useCallback(
    (entry: ConsoleEntry) => {
      buffered.current.push(entry);
      flush();
    },
    [flush],
  );

  const showInput = useCallback(() => {
    if (holding.current) inputWanted.current = true;
    else setAcceptingInput(true);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      clearTimeout(inputTimer.current);
      clearTimeout(loadingTimer.current);
    },
    [],
  );

  const run = useCallback(
    async (filename: string) => {
      const token = ++runToken.current;
      // A frame still due from the last run would show this run's output early.
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      buffered.current = [];
      setEntries([]);
      setRunning(true);
      setAcceptingInput(false);
      clearTimeout(inputTimer.current);
      clearTimeout(loadingTimer.current);
      let started = false;

      holding.current = true;
      inputWanted.current = false;
      setLoading(true);
      loadingTimer.current = setTimeout(() => {
        if (token !== runToken.current) return;
        holding.current = false;
        // Everything held back appears in the same render that hides the
        // loader (not a frame later, which would flash the empty-console
        // hint), along with the input box if the program is still running
        // and seems to want input.
        const added = buffered.current;
        buffered.current = [];
        setEntries((prev) => append(prev, added));
        setLoading(false);
        if (inputWanted.current) setAcceptingInput(true);
      }, MIN_LOADING_MS);

      const onEvent = (event: RunEvent) => {
        if (token !== runToken.current) return;
        if (event.type === "started") {
          started = true;
          inputTimer.current = setTimeout(() => {
            if (token === runToken.current) showInput();
          }, SHOW_INPUT_AFTER_MS);
        } else if (event.type === "output") {
          push({ kind: event.stream, text: event.text });
          if (started && event.stream === "stdout") showInput();
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
          // Finished during the loader: show the output, never the input box.
          inputWanted.current = false;
          setAcceptingInput(false);
          setRunning(false);
        }
      }
    },
    [push, showInput],
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

  return { entries, running, loading, acceptingInput, run, send, stop, clear };
}
