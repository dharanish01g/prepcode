import { Channel, invoke } from "@tauri-apps/api/core";

/** Mirrors RunEvent in src-tauri/src/run.rs. */
export type RunEvent =
  | { type: "started" }
  | { type: "output"; stream: "stdout" | "stderr"; text: string }
  | {
      type: "exit";
      code: number | null;
      /** macOS/Linux only: the signal that ended the program, if it has no exit code. */
      signal: number | null;
      stopped: boolean;
      stage: "compile" | "run";
    };

/** Runs a file from the student's workspace; resolves when the run is over. */
export function runProgram(filename: string, onEvent: (event: RunEvent) => void) {
  const channel = new Channel<RunEvent>();
  channel.onmessage = onEvent;
  return invoke<void>("run_program", { filename, onEvent: channel });
}

export function sendInput(text: string) {
  return invoke<void>("send_input", { text });
}

export function stopProgram() {
  return invoke<void>("stop_program");
}

export type RunExit = Extract<RunEvent, { type: "exit" }>;

/** Common crash signals on macOS and Linux (same numbers on both). */
const SIGNAL_NAMES: Record<number, string> = {
  4: "SIGILL",
  6: "SIGABRT",
  8: "SIGFPE",
  9: "SIGKILL",
  11: "SIGSEGV",
  15: "SIGTERM",
};

/** Windows crash codes are large negative numbers, recognisable in hex (e.g. 0xC0000005). */
function formatCode(code: number) {
  return code < -1000 ? `0x${(code >>> 0).toString(16).toUpperCase()}` : String(code);
}

/**
 * How a run ended, in a few words with its exit code, for the console and its
 * footer. `end` is "error" if the program couldn't be run at all.
 */
export function describeRunEnd(end: RunExit | "error"): {
  label: string;
  tone: "success" | "warning" | "error";
} {
  if (end === "error") return { label: "Couldn't run", tone: "error" };
  if (end.stopped) return { label: "Stopped by you", tone: "warning" };
  if (end.code === null) {
    if (end.signal === null) return { label: "Ended unexpectedly, no exit code", tone: "error" };
    const name = SIGNAL_NAMES[end.signal];
    return { label: `Crashed with signal ${end.signal}${name ? ` (${name})` : ""}`, tone: "error" };
  }
  const code = formatCode(end.code);
  if (end.stage === "compile") return { label: `Didn't compile, exit code ${code}`, tone: "error" };
  return end.code === 0
    ? { label: "Finished, exit code 0", tone: "success" }
    : { label: `Finished, exit code ${code}`, tone: "error" };
}
