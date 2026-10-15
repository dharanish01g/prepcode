import { useEffect } from "react";
import { checkForUpdate } from "@/lib/updates";

/** Tries again this long after a failed launch check. */
const RETRY_MS = 2 * 60 * 1000;

/**
 * Checks for a newer version on launch (see checkForUpdate), and once more a
 * little later if that fails: the network often isn't up yet, e.g. before the
 * student signs in to the college Wi-Fi.
 */
export function AppUpdater() {
  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    checkForUpdate().catch((err) => {
      console.error("Update check failed:", err);
      retry = setTimeout(() => {
        // Still unreachable: try again next launch.
        checkForUpdate().catch((err) => console.error("Update check failed again:", err));
      }, RETRY_MS);
    });
    return () => clearTimeout(retry);
  }, []);

  return null;
}
