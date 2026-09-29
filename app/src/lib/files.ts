import { invoke } from "@tauri-apps/api/core";

/** Keep in sync with EXTENSIONS in src-tauri/src/files.rs. */
export const LANGUAGES = [
  { value: "py", label: "Python", monaco: "python" },
  { value: "js", label: "JavaScript", monaco: "javascript" },
  { value: "c", label: "C", monaco: "c" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "java", label: "Java", monaco: "java" },
] as const;

export type Extension = (typeof LANGUAGES)[number]["value"];

export function extensionOf(filename: string) {
  return filename.slice(filename.lastIndexOf(".") + 1);
}

/** Monaco language id for a filename, e.g. "hello.py" -> "python". */
export function monacoLanguageOf(filename: string) {
  return LANGUAGES.find((lang) => lang.value === extensionOf(filename))?.monaco ?? "plaintext";
}

/** Filenames (e.g. "hello.py") in the logged-in student's workspace. */
export function listFiles() {
  return invoke<string[]>("list_files");
}

/** Creates an empty file and returns its filename. Rejects with a user-facing message. */
export function createFile(name: string, extension: Extension) {
  return invoke<string>("create_file", { name, extension });
}

export function readFile(filename: string) {
  return invoke<string>("read_file", { filename });
}

// Saves run one at a time, in order, so an older save can never land after a
// newer one and overwrite it.
let saveQueue: Promise<unknown> = Promise.resolve();

export function writeFile(filename: string, content: string) {
  const save = saveQueue
    .catch(() => {})
    .then(() => invoke<void>("write_file", { filename, content }));
  saveQueue = save;
  return save;
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
