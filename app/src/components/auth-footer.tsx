import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

export const COMPANY = "Meikural Edu Tech India Private Limited";

/** App name and version on the left, copyright on the right. */
export function AuthFooter() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    // From tauri.conf.json, so it always matches the installed release.
    getVersion()
      .then(setVersion)
      .catch(() => {});
  }, []);

  return (
    <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-4 pb-4 text-xs text-muted-foreground">
      <span>prepcode{version && ` v${version}`}</span>
      <span className="text-right">
        © {new Date().getFullYear()} {COMPANY}. All rights reserved.
      </span>
    </footer>
  );
}
