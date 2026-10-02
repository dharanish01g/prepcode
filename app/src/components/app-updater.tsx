import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { isCloseBlocked } from "@/lib/close-guard";

/**
 * Checks GitHub Releases for a newer version on launch, downloads it in the
 * background, and installs it when the app closes, so a student is never
 * interrupted mid-program. "Restart now" applies it immediately.
 */
export function AppUpdater() {
  useEffect(() => {
    // Dev builds aren't released; don't try to update them.
    if (import.meta.env.DEV) return;

    let cancelled = false;
    let stopListening: (() => void) | undefined;

    (async () => {
      try {
        const update = await check();
        if (!update || cancelled) return;

        await update.download();
        if (cancelled) return;

        // Tauri closes the window once this handler finishes. On Windows,
        // install() hands over to the installer, which exits the app itself.
        stopListening = await getCurrentWindow().onCloseRequested(async () => {
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
      } catch (err) {
        // Offline or GitHub unreachable: just try again next launch.
        console.error("Update check failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      stopListening?.();
    };
  }, []);

  return null;
}
