import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { isCloseBlocked } from "@/lib/close-guard";
import { reportError } from "@/lib/reporting";

const RELEASES_URL = "https://github.com/dharanish01g/prepcode/releases/latest";

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
  let update: Update | null;
  try {
    update = await check();
  } catch (err) {
    // The app finds out why (DNS, timeout, firewall…) and reports it.
    void invoke("report_update_failure", { error: String(err) }).catch(() => {});
    throw err;
  }
  if (!update) return { kind: "latest" };

  await update.download();
  ready = update;

  // Tauri closes the window once this handler finishes. On Windows,
  // install() hands over to the installer, which exits the app itself.
  const stopInstallOnClose = await getCurrentWindow().onCloseRequested(async (event) => {
    // Held back to warn about unsynced changes: not closing (yet).
    if (isCloseBlocked()) return;
    // Stay open to say why it failed; the next close is a normal one.
    if (!(await install())) event.preventDefault();
  });

  const readyToast = toast("Update ready", {
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
        if (await install()) await relaunch();
      },
    },
  });

  /**
   * Installs the update, or explains why it couldn't. On Windows the updater
   * frees the update and hides the window before starting the installer, so
   * if Windows then blocks the installer (e.g. Smart App Control), this
   * update can't be tried again: forget it, so closing the app works again.
   */
  const install = async (): Promise<boolean> => {
    try {
      await update.install();
      return true;
    } catch (err) {
      reportError(err);
      ready = null;
      stopInstallOnClose();
      toast.dismiss(readyToast);
      await getCurrentWindow()
        .show()
        .catch(() => {});
      toast.error("Couldn't install the update", {
        description: `${String(err)} You can download prepcode ${update.version} and install it yourself.`,
        duration: Infinity,
        action: {
          label: "Download",
          onClick: () => {
            openUrl(RELEASES_URL).catch((e) =>
              console.error("Could not open the download page:", e),
            );
          },
        },
      });
      return false;
    }
  };

  return { kind: "ready", version: update.version };
}
