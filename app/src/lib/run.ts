import { Channel, invoke } from "@tauri-apps/api/core";

/** Mirrors RunEvent in src-tauri/src/run.rs. */
export type RunEvent =
  | { type: "status"; message: string }
  | { type: "started" }
  | { type: "output"; stream: "stdout" | "stderr"; text: string }
  | { type: "exit"; code: number | null; stopped: boolean; stage: "compile" | "run" };

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
