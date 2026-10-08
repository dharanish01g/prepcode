import { getCurrentWindow } from "@tauri-apps/api/window";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { isCloseBlocked } from "@/lib/close-guard";

export type UpdateStatus =
  /** Dev builds aren't released, so they never update. */
  | { kind: "dev" }
  | { kind: "latest" }
  /** Downloaded; installs when the app closes, or on "Restart now". */
  | { kind: "ready"; version: string };

// One check at a time, and one download per run of the app: the launch check
// and the About page's button share them.
let checking: Promise<UpdateStatus> | null = null;
let ready: Update | null = null;

/**
 * Checks GitHub Releases for a newer version and downloads it in the
 * background. It installs when the app closes, so a student is never
 * interrupted mid-program; the toast's "Restart now" applies it immediately.
 * Rejects if GitHub can't be reached.
 */
export function checkForUpdate(): Promise<UpdateStatus> {
  if (import.meta.env.DEV) return Promise.resolve({ kind: "dev" });
  if (ready) return Promise.resolve({ kind: "ready", version: ready.version });
  checking ??= download().finally(() => {
    checking = null;
  });
  return checking;
}

async function download(): Promise<UpdateStatus> {
  const update = await check();
  if (!update) return { kind: "latest" };

  await update.download();
  ready = update;

  // Tauri closes the window once this handler finishes. On Windows,
  // install() hands over to the installer, which exits the app itself.
  await getCurrentWindow().onCloseRequested(async () => {
    // Held back to warn about unsynced changes: not closing (yet).
    if (isCloseBlocked()) return;
    await update.install();
  });

  toast("Update ready", {
    description: `prepcode ${update.version} will be installed when you close the app.`,
    duration: Infinity,
    action: {
      label: "Restart now",
      onClick: async () => {
        // Something would be lost (unsynced changes, a guest's files):
        // ask first, the same as closing. If they go ahead, the update
        // installs on that close.
        if (isCloseBlocked()) {
          await getCurrentWindow().close();
          return;
        }
        await update.install();
        await relaunch();
      },
    },
  });
  return { kind: "ready", version: update.version };
}
