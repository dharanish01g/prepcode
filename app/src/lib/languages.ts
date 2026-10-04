import { invoke } from "@tauri-apps/api/core";

/** A supported language or database, from the backend's language catalog. */
export type Language = {
  /** File extension, e.g. "py". Also the language's id. */
  extension: string;
  /** Programs live in the Programs view; database files (queries) in Database. */
  kind: "program" | "database";
  /** e.g. "Python". */
  name: string;
  /** Monaco editor language id. */
  monaco: string;
  /** Which built-in formatter to use (see format.ts), if any. */
  formatter: string | null;
  /** SVG logo. */
  icon: string | null;
  /** Languages with the same runtime share one download. */
  runtime: string;
};

let languages: Language[] = [];

/** Loads the catalog. Called once before the app renders. */
export async function loadLanguages() {
  languages = await invoke<Language[]>("list_languages");
}

/** Every supported language (or database) of this kind, in display order. */
export function getLanguages(kind: Language["kind"]) {
  return languages.filter((lang) => lang.kind === kind);
}

export function findLanguage(extension: string) {
  return languages.find((lang) => lang.extension === extension);
}
