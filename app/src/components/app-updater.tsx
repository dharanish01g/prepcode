import { useEffect } from "react";
import { checkForUpdate } from "@/lib/updates";

/** Checks for a newer version once, on launch (see checkForUpdate). */
export function AppUpdater() {
  useEffect(() => {
    // Offline or GitHub unreachable: just try again next launch.
    checkForUpdate().catch((err) => console.error("Update check failed:", err));
  }, []);

  return null;
}
