# prepcode app

The desktop app: a Tauri (Rust) backend with a React + TypeScript frontend.

## Running it

```sh
pnpm install
pnpm tauri dev
```

## Where things live

| Path | What's there |
|---|---|
| `src/` | The React frontend. |
| `src/components/` | Screens, dialogs and panels. |
| `src/components/ui/` | shadcn components. Add new ones with the shadcn CLI. |
| `src/lib/` | Calls into the Rust backend, Supabase and other non-UI code. |
| `src/hooks/` | React hooks (running programs and queries, sync, theme, zoom). |
| `src-tauri/src/` | The Rust backend, one module per job (`auth`, `files`, `run`, `sql`, …). `lib.rs` registers every command. |
| `src-tauri/catalog/` | The supported languages and databases, as data. |
| `installer/` | The Windows installer. |

## Adding a language or database

Languages and databases are entries in `src-tauri/catalog/catalog.json`, not
code. Follow [`src-tauri/catalog/README.md`](src-tauri/catalog/README.md).
