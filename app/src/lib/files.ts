import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";
import { findLanguage } from "@/lib/languages";

/**
 * "queries.mysql.sql" -> "mysql.sql". Names never contain a dot, so everything
 * after the first one is the extension, which may itself have dots.
 */
export function extensionOf(filename: string) {
  return filename.slice(filename.indexOf(".") + 1);
}

/** Monaco language id for a filename, e.g. "hello.py" -> "python". */
export function monacoLanguageOf(filename: string) {
  return findLanguage(extensionOf(filename))?.monaco ?? "plaintext";
}

/** Filenames (e.g. "hello.py") in the logged-in student's workspace. */
export function listFiles() {
  return invoke<string[]>("list_files");
}

export type FileHistoryEntry = {
  filename: string;
  /** Last modified, in milliseconds since the epoch. */
  modified: number;
};

/** The student's files with when each was last edited, newest first. */
export function listFileHistory() {
  return invoke<FileHistoryEntry[]>("list_file_history");
}

/** Creates an empty file and returns its filename. Rejects with a user-facing message. */
export function createFile(name: string, extension: string) {
  // Today's folder, in local time, e.g. "02oct2026".
  const folder = format(new Date(), "ddMMMyyyy").toLowerCase();
  return invoke<string>("create_file", { name, extension, folder });
}

export function readFile(filename: string) {
  return invoke<string>("read_file", { filename });
}

// Saves, renames and deletes run one at a time, in order, so an older save can
// never land after a newer one, and a save queued before a delete can't bring
// the file back afterwards.
let saveQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>) {
  const run = saveQueue.catch(() => {}).then(task);
  saveQueue = run;
  return run;
}

export function writeFile(filename: string, content: string) {
  return enqueue(() => invoke<void>("write_file", { filename, content }));
}

/** Renames, keeping the extension; returns the new filename. Rejects with a user-facing message. */
export function renameFile(filename: string, newName: string) {
  return enqueue(() => invoke<string>("rename_file", { filename, newName }));
}

/** Permanently deletes the file. */
export function deleteFile(filename: string) {
  return enqueue(() => invoke<void>("delete_file", { filename }));
}

/** The student's saved code for a practice question, or null if they haven't started it. */
export function readPractice(question: string, extension: string) {
  return invoke<string | null>("read_practice", { question, extension });
}

/** Saves the student's code for a practice question, queued like other saves. */
export function writePractice(question: string, extension: string, content: string) {
  return enqueue(() => invoke<void>("write_practice", { question, extension, content }));
}

/** Resolves once every queued save has finished (successfully or not). */
export function whenSavesSettled() {
  return saveQueue.then(
    () => {},
    () => {},
  );
}

/** Mirrors validate_name in files.rs so errors show while typing. */
export function fileNameError(name: string): string | null {
  if (!name) return null;
  if (name.length > 64) return "File name is too long (max 64 characters).";
  if (name.startsWith("-") || !/^[A-Za-z0-9_-]+$/.test(name)) {
    return "Use only letters, numbers, _ and -.";
  }
  return null;
}

/**
 * Zips a guest's files into Downloads as prepcode_guest_<date & time>.zip and
 * returns the zip's path. Rejects with a user-facing message.
 */
export function exportGuestFiles() {
  return invoke<string>("export_guest_files", { stamp: format(new Date(), "yyyy-MM-dd_HH-mm-ss") });
}
