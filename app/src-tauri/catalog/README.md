# Adding a language

Languages (and databases, see [Databases](#databases)) are data, not code.
Supporting a new one means adding entries to `catalog.json` and bumping its
`version`; the app imports the catalog into its database on launch when the
version is newer. The only code change ever needed
is a new formatter (see [Formatter](#formatter)).

Use Go (`go-1.27.1` / `"go"`) in `catalog.json` as a worked example.

---

## 1. Gather what you need

### Runtime (the compiler/interpreter prepcode downloads)

| Need | Notes |
|---|---|
| **Portable archive** for each platform | `windows x86_64`, `macos aarch64`, `macos x86_64`, `linux x86_64`. Must run from any folder without an installer, admin rights, or system changes. Official builds only. |
| **SHA-256** of each archive | From the project's official checksum list, **not** computed from your own download. |
| **Archive kind** | `zip`, `tar.gz` or `tar.xz`. |
| **Executable path** per OS | Relative to the archive's top folder (a single top-level folder is stripped), e.g. `bin/go.exe` / `bin/go`. |
| **Version arguments** | Makes the executable print its version and exit 0 (`--version`, `version`, `-version`). Used to prove the install works. |
| **Environment** | Keep the runtime self-contained: caches in `{shared}/…`, no auto-updates, no telemetry, no user config. See [Environment](#environment). |
| **Warmup** (optional) | A throwaway build run once after install, if the first real compile would otherwise be slow (Zig, Go). |
| **Runtime id** | `<name>-<version>`, e.g. `go-1.27.1`. The version in the id means an upgrade installs beside the old one instead of over it. |

### Language (how students' files use the runtime)

| Need | Notes |
|---|---|
| **Extension** | Lowercase letters and digits (dot-separated parts allowed, e.g. `mysql.sql`), max 16. Also the language's id. |
| **Name** | Shown to students, e.g. `Go`. |
| **Monaco id** | Editor highlighting. Must be one of [Monaco's languages](https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages), otherwise it shows as plain text. |
| **Formatter** | One of the app's built-in formatters, or `null`. See [Formatter](#formatter). |
| **Icon** | SVG from the [Icons – Maintained](https://github.com/yusifaliyevpro/vscode-icons/tree/main/icons) theme, so all icons match (MIT, see `ICONS-LICENSE`). |
| **Compile step** (compiled languages) | Must write the program to `{binary}`. Omit for interpreted languages. |
| **Run step** | Runs `{binary}`, or the runtime with the file (`{filename}`). |
| **Unbuffered output** | Prompts like `Enter a number: ` must appear *before* the program waits for input. Check how the language buffers stdout when it's a pipe; fix with a flag (Python `-u`), a prelude file (C/C++), or nothing (Go, Node, Java). |

---

## 2. Template

Add the runtime to `runtimes` and the language to `languages` (its position
there is its order in the app), then **bump `version`**.

```jsonc
// In "runtimes":
{
  "id": "NAME-VERSION",
  "exe": { "windows": "bin/NAME.exe", "macos": "bin/NAME", "linux": "bin/NAME" },
  "version_args": ["--version"],
  "env": {
    // Only what's needed to keep it self-contained, e.g.
    "NAME_CACHE": "{shared}/NAME-cache"
  },
  "warmup": [                       // optional
    {
      "files": { "warmup.EXT": "…smallest program that uses the standard library…" },
      "args": ["build", "-o", "warmup", "warmup.EXT"]
    }
  ],
  "downloads": [
    { "os": "windows", "arch": "x86_64",  "url": "https://…", "sha256": "…", "kind": "zip" },
    { "os": "macos",   "arch": "aarch64", "url": "https://…", "sha256": "…", "kind": "tar.gz" },
    { "os": "macos",   "arch": "x86_64",  "url": "https://…", "sha256": "…", "kind": "tar.gz" },
    { "os": "linux",   "arch": "x86_64",  "url": "https://…", "sha256": "…", "kind": "tar.gz" }
  ]
}

// In "languages":
{
  "extension": "EXT",
  "name": "Name",
  "monaco": "monaco-id",
  "formatter": "FORMATTER-or-null",
  "runtime": "NAME-VERSION",
  "icon": "<svg …>…</svg>",
  // Compiled languages only:
  "compile": { "args": ["build", "-o", "{binary}", "{source}"] },
  // Compiled:     { "program": "{binary}" }
  // Interpreted:  { "args": ["{filename}"] }
  "run": { "program": "{binary}" }
}
```

A **step** (`compile`, `run`, each `warmup` entry) has:

| Field | Default | Meaning |
|---|---|---|
| `program` | the runtime's executable | What to run. |
| `args` | `[]` | Arguments. |
| `env` | `{}` | Extra environment, on top of the runtime's `env`. |
| `files` | `{}` | `name → contents` written into the build folder (warmup: a scratch folder) first, e.g. C's prelude header. Plain file names only. |

### Placeholders

| Placeholder | Value | Available in |
|---|---|---|
| `{source}` | Full path of the student's file | compile, run |
| `{filename}` | Just the file name, e.g. `hello.py` | compile, run |
| `{binary}` | Where the compile step must write the program | compile, run |
| `{build}` | prepcode's build folder for this student | compile, run |
| `{shared}` | prepcode's shared data folder (runtimes and caches live here) | everywhere, incl. runtime `env` |

Working folders: **compile** runs in the build folder; **run** runs in the
student's workspace (so programs can open files next to their code); **warmup**
runs in a scratch folder that's deleted afterwards.

### Environment

Point every cache and download folder into `{shared}`, and turn off anything
that reaches out or reads the user's own setup. For Go that was:

```json
"GOCACHE": "{shared}/go-cache", "GOPATH": "{shared}/go-path",
"GOTOOLCHAIN": "local", "GOTELEMETRY": "off", "GOENV": "off", "CGO_ENABLED": "0"
```

(`CGO_ENABLED=0` because Windows lab PCs have no C compiler.)

### Formatter

Built-in formatters: `prettier`, `ruff`, `clang-format`, `gofmt`. If none fits
the new language, it's the one code change:

1. Add a bundled, offline formatter (WASM preferred, e.g. from
   [`@wasm-fmt`](https://github.com/wasm-fmt)): `pnpm add …`.
2. Add a lazy loader and a `case` in `app/src/lib/format.ts`, and its name to
   `FORMATTERS` there.
3. Add the package to `optimizeDeps.exclude` in `app/vite.config.ts` if it loads
   `.wasm`.

Otherwise use `null`: the Format button is then disabled for that language.

---

## Databases

A database (MySQL so far) is a language entry with `"kind": "database"`. It
shows in the Database view's New file dialog instead of Programs', and it gets
its own extension because the extension is the id. Since they're all SQL,
database extensions end in `.sql`: `queries.mysql.sql`, later `.pgsql.sql`, …
(an extension may have dots; file names can't, so the first dot splits them).
Its runtime is the database server, downloaded once per computer like any
other. Use MySQL (`mysql-8.4.11` / `"mysql.sql"`) as the worked example.

```jsonc
// In "languages":
{
  "extension": "mysql.sql",
  "kind": "database",
  "name": "MySQL",
  "monaco": "mysql",
  "formatter": null,
  "runtime": "mysql-8.4.11",
  "icon": "<svg …>…</svg>",
  // No compile or run step (yet). Instead, steps that create the signed-in
  // account's own data folder, {data}, once per account:
  "setup": [{ "args": ["--no-defaults", "--initialize-insecure",
                       "--basedir={runtime}", "--datadir={data}"] }]
}
```

Setup runs after the download, or on its own when another account on the PC
already downloaded it. It writes into a scratch folder that's renamed to
`{data}` only if every step succeeds. Setup steps also get these placeholders:

| Placeholder | Value |
|---|---|
| `{data}` | The folder setup must create (it doesn't exist yet) |
| `{runtime}` | The runtime's install folder, e.g. for MySQL's `--basedir` |

Keep setup self-contained like the runtime: ignore system config files
(`--no-defaults` for MySQL) and keep the data small, since every account on a
lab PC gets its own copy (MySQL's `--innodb-redo-log-capacity=8M` makes it
~100 MB instead of ~190 MB).

**Checksums:** MySQL publishes MD5 files and GPG signatures (`<archive>.md5`,
`<archive>.asc` next to each download), not SHA-256. Check the archive against
both, then record the SHA-256 of that verified archive.

**Windows:** MySQL needs the Microsoft Visual C++ runtime, which its zip doesn't
include. Check on a freshly installed lab PC; without it, "Checking…" fails.

## 3. Verify

Tick every box before committing. "All platforms" means each of the four
download targets; at minimum test the one you're on and have someone run the
Windows checks on a lab PC.

### Catalog

- [ ] `cargo test` passes (it validates the bundled catalog). Update the
      expected language list in `catalog.rs`'s `imports_bundled_catalog`.
- [ ] `version` is bumped.
- [ ] Every URL is `https://` from the official source, and every SHA-256 comes
      from the official checksum list.

### Install (New file → Language → Download)

- [ ] Downloads, shows progress, unpacks, and "Checking…" passes on all platforms.
- [ ] Warmup (if any) finishes; its cache is inside the shared data folder, and
      **nothing** new appears in the home folder (`~/.cache`, `~/go`,
      `%LOCALAPPDATA%`, …).
- [ ] C and C++-style pairs sharing a runtime: downloading one marks both installed.
- [ ] Windows: a second Windows account on the same PC sees it as installed
      without downloading again.

### Run

- [ ] Hello world prints its output and nothing else.
- [ ] A program that asks for input shows the prompt **before** waiting, and
      the typed value is read correctly.
- [ ] A compile error (compiled languages) shows the compiler's message and
      stops at the compile stage; nothing runs.
- [ ] A runtime error / non-zero exit shows its output and exit code.
- [ ] Stop ends a program stuck in an infinite loop, and one waiting for input.
- [ ] Clicking Run twice quickly works (the second run replaces the first).
- [ ] Non-English output (`héllo ✓ 世界`) prints correctly, including on Windows.
- [ ] File names with `_` and `-` (e.g. `my-prog_2`) compile and run.
- [ ] The student's workspace gets no extra files (like Python's `__pycache__`).
- [ ] Windows: no console window flashes open when running.
- [ ] Works with the network off once installed.

### Editor

- [ ] Syntax highlighting works.
- [ ] Icon shows in the sidebar, New file dialog and breadcrumb.
- [ ] Format fixes messy indentation (if a formatter is set); broken code shows
      "Fix the errors in your code first"; Ctrl/Cmd+Z undoes a format.
- [ ] Create, rename and delete a file of the new type.

### Upgrade

- [ ] On a machine running the previous release, the new language appears
      after updating, without losing accounts or files.
