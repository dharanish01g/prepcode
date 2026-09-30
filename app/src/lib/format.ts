import { extensionOf, type Extension } from "@/lib/files";

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

/**
 * Formats a student's program by its file type: Prettier for JavaScript,
 * Ruff for Python, clang-format for C, C++ and Java. Throws if the code
 * can't be parsed (e.g. a Python syntax error).
 */
export async function formatCode(filename: string, code: string): Promise<string> {
  const extension = extensionOf(filename) as Extension;
  switch (extension) {
    case "js":
      return formatJavaScript(code);
    case "py": {
      const ruff = await loadRuff();
      return ruff.format(code, filename, { indent_width: 4, line_width: 100 });
    }
    case "c":
    case "cpp":
    case "java": {
      const clang = await loadClang();
      return clang.format(code, `main.${extension}`, CLANG_STYLE);
    }
    default:
      throw new Error(`Can't format .${extension} files.`);
  }
}
