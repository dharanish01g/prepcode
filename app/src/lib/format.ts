import { extensionOf } from "@/lib/files";
import { findLanguage } from "@/lib/languages";

// Each formatter is loaded the first time it's needed, so the app starts as
// fast as before. All of them are bundled (WASM or JS), so they work offline.

/**
 * clang-format style for C, C++ and Java: Google's, but with 4-space
 * indentation to match the editor, and every function body, if and loop on
 * its own lines, which beginners read more easily. Includes stay in the
 * student's order, since sorting them can change what a program does.
 */
const CLANG_STYLE = `{${[
  "BasedOnStyle: Google",
  "IndentWidth: 4",
  "AccessModifierOffset: -4",
  "ColumnLimit: 100",
  "AllowShortFunctionsOnASingleLine: Empty",
  "AllowShortIfStatementsOnASingleLine: Never",
  "AllowShortLoopsOnASingleLine: false",
  "AllowShortBlocksOnASingleLine: Never",
  "SortIncludes: Never",
].join(", ")}}`;

let clangReady: Promise<typeof import("@wasm-fmt/clang-format/vite")> | undefined;
function loadClang() {
  clangReady ??= import("@wasm-fmt/clang-format/vite").then(async (mod) => {
    await mod.default();
    return mod;
  });
  return clangReady;
}

let gofmtReady: Promise<typeof import("@wasm-fmt/gofmt/vite")> | undefined;
function loadGofmt() {
  gofmtReady ??= import("@wasm-fmt/gofmt/vite").then(async (mod) => {
    await mod.default();
    return mod;
  });
  return gofmtReady;
}

let ruffReady: Promise<typeof import("@wasm-fmt/ruff_fmt/vite")> | undefined;
function loadRuff() {
  ruffReady ??= import("@wasm-fmt/ruff_fmt/vite").then(async (mod) => {
    await mod.default();
    return mod;
  });
  return ruffReady;
}

async function formatJavaScript(code: string) {
  const [prettier, babel, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
  ]);
  return prettier.format(code, {
    parser: "babel",
    plugins: [babel, estree],
    tabWidth: 4,
    printWidth: 100,
  });
}

/** Thrown when a file's language has no formatter, as opposed to bad code. */
export class NoFormatterError extends Error {}

/** Whether the Format button can do anything for this file. */
export function canFormat(filename: string) {
  return FORMATTERS.includes(findLanguage(extensionOf(filename))?.formatter ?? "");
}

const FORMATTERS = ["prettier", "ruff", "clang-format", "gofmt"];

/**
 * Formats a student's program with the formatter its language names in the
 * catalog: "prettier" (JavaScript), "ruff" (Python), "gofmt" (Go) or
 * "clang-format" (C, C++, Java, C#; it picks the language from the file
 * extension). Throws if the code can't be parsed (e.g. a Python syntax
 * error), or NoFormatterError if the language has no formatter.
 */
export async function formatCode(filename: string, code: string): Promise<string> {
  const extension = extensionOf(filename);
  switch (findLanguage(extension)?.formatter) {
    case "prettier":
      return formatJavaScript(code);
    case "ruff": {
      const ruff = await loadRuff();
      return ruff.format(code, filename, { indent_width: 4, line_width: 100 });
    }
    case "gofmt": {
      const gofmt = await loadGofmt();
      return gofmt.format(code);
    }
    case "clang-format": {
      const clang = await loadClang();
      return clang.format(code, `main.${extension}`, CLANG_STYLE);
    }
    default:
      throw new NoFormatterError(`Can't format .${extension} files.`);
  }
}
