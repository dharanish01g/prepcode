import { invoke, type InvokeArgs } from "@tauri-apps/api/core";

// The frontend never calls a server itself: everything from prepcode's
// backend comes through a Rust command, which asks the backend (see
// src-tauri/src/backend). The window isn't even allowed to (the CSP's
// connect-src), so changing the backend never touches the frontend.

/**
 * Runs a Rust command that reads from the backend. Its failure becomes an
 * `Error` (a command fails with a plain message), so screens can show
 * `error.message`.
 */
export async function fromBackend<T>(command: string, args?: InvokeArgs): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(String(error));
  }
}
