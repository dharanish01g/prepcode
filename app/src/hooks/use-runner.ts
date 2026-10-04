import { useCallback, useEffect, useRef, useState } from "react";
import { runProgram, sendInput, stopProgram, type RunEvent } from "@/lib/run";

export type ConsoleEntry = {
  kind: "stdout" | "stderr" | "input" | "status" | "error";
  text: string;
};

/** Oldest output is dropped past this, so a runaway loop can't freeze the app. */
const MAX_CONSOLE_CHARS = 200_000;

/**
 * Each run shows a loader for at least this long, and after that until the
 * program prints something or finishes. Otherwise the console flickers: the
 * empty-console hint, the input box, then output (worst for Java, which
 * compiles inside the run, so a second can pass before any output).
 */
const MIN_LOADING_MS = 400;

/**
 * Programs can't tell us when they're waiting for input. One that has run this
 * long without printing anything might be (e.g. reading input without a
 * prompt), so the loader gives way to the input box then.
 */
const SILENT_INPUT_AFTER_MS = 3000;

/**
 * After the program prints, the input box waits until output has been quiet
 * this long, so it doesn't flash for a program that prints and exits, but
 * appears soon after a prompt.
 */
const INPUT_SETTLE_MS = 300;

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
  // Each program keeps the output of its own last run, by filename.
  const [consoles, setConsoles] = useState<Partial<Record<string, ConsoleEntry[]>>>({});
  // The program of the current (or last) run; the states below are about it.
  const [runFile, setRunFile] = useState<string | null>(null);
  const runFileRef = useRef<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  // Loading for a while (e.g. a slow compile): Stop is offered meanwhile.
  const [loadingLong, setLoadingLong] = useState(false);
  const [acceptingInput, setAcceptingInput] = useState(false);

  // Events from a previous run are ignored once a new run starts.
  const runToken = useRef(0);
  // Output arrives in bursts; apply it once per animation frame.
  const buffered = useRef<ConsoleEntry[]>([]);
  const frame = useRef<number | null>(null);
  // While the loader shows, output only collects in `buffered`.
  const holding = useRef(false);
  // The current run's timers, cleared when it ends or another starts.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setEntries = useCallback(
    (file: string, update: (prev: ConsoleEntry[]) => ConsoleEntry[]) =>
      setConsoles((prev) => ({ ...prev, [file]: update(prev[file] ?? []) })),
    [],
  );

  const flush = useCallback(() => {
    if (holding.current || frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const added = buffered.current;
      buffered.current = [];
      // Buffered output is always the current run's: a new run empties it.
      const file = runFileRef.current;
      if (file) setEntries(file, (prev) => append(prev, added));
    });
  }, [setEntries]);

  const push = useCallback(
    (entry: ConsoleEntry) => {
      buffered.current.push(entry);
      flush();
    },
    [flush],
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(inputTimer.current);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      clearTimers();
    },
    [clearTimers],
  );

  const run = useCallback(
    async (filename: string) => {
      const token = ++runToken.current;
      const current = () => token === runToken.current;
      // A frame still due from the last run would show this run's output early.
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      clearTimers();
      buffered.current = [];
      runFileRef.current = filename;
      setRunFile(filename);
      setEntries(filename, () => []);
      setRunning(true);
      setAcceptingInput(false);

      holding.current = true;
      setLoading(true);
      setLoadingLong(false);
      let minElapsed = false;
      let printed = false; // anything, on stdout or stderr
      let exited = false;
      let started = false; // the program itself, after any compile step

      // Shows the input box once stdout has been quiet for a moment, if the
      // program is still running by then.
      const settleInput = (delay: number) => {
        clearTimeout(inputTimer.current);
        inputTimer.current = setTimeout(() => {
          if (current() && !exited && !holding.current) setAcceptingInput(true);
        }, delay);
      };

      // Ends the loader once it's been up long enough and there's something
      // to show: output, the end of the run, or a long silence.
      const release = (silent = false) => {
        if (!current() || !holding.current || !minElapsed) return;
        if (!printed && !exited && !silent) return;
        holding.current = false;
        // Everything held back appears in the same render that hides the
        // loader (not a frame later, which would flash the empty-console hint).
        const added = buffered.current;
        buffered.current = [];
        setEntries(filename, (prev) => append(prev, added));
        setLoading(false);
        setLoadingLong(false);
        if (exited) return;
        if (silent) setAcceptingInput(true);
        else if (started && added.some((e) => e.kind === "stdout")) settleInput(INPUT_SETTLE_MS);
      };

      timers.current.push(
        setTimeout(() => {
          minElapsed = true;
          release();
        }, MIN_LOADING_MS),
        setTimeout(() => {
          if (current() && holding.current) setLoadingLong(true);
        }, SILENT_INPUT_AFTER_MS),
      );

      const onEvent = (event: RunEvent) => {
        if (!current()) return;
        if (event.type === "started") {
          started = true;
          timers.current.push(setTimeout(() => release(true), SILENT_INPUT_AFTER_MS));
        } else if (event.type === "output") {
          push({ kind: event.stream, text: event.text });
          printed = true;
          if (holding.current) release();
          else if (started && event.stream === "stdout" && !exited) settleInput(INPUT_SETTLE_MS);
        } else {
          const message = exitMessage(event);
          if (message) push({ kind: event.stopped ? "status" : "error", text: message });
        }
      };

      try {
        await runProgram(filename, onEvent);
      } catch (err) {
        if (current()) push({ kind: "error", text: String(err) });
      } finally {
        if (current()) {
          exited = true;
          clearTimeout(inputTimer.current);
          setAcceptingInput(false);
          setRunning(false);
          // Over already: no loader beyond the minimum, and never the input box.
          release();
        }
      }
    },
    [push, clearTimers, setEntries],
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

  const clear = useCallback(
    (file: string) => {
      if (file === runFileRef.current) buffered.current = [];
      setEntries(file, () => []);
    },
    [setEntries],
  );

  /**
   * The console as `file` should show it: its own output, and the loader,
   * running state and input box only if it's the program being run.
   */
  const consoleFor = (file: string) => {
    const active = file === runFile;
    return {
      entries: consoles[file] ?? [],
      running: active && running,
      loading: active && loading,
      loadingLong: active && loadingLong,
      acceptingInput: active && acceptingInput,
    };
  };

  return { running, consoleFor, run, send, stop, clear };
}
