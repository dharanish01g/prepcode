import { invoke } from "@tauri-apps/api/core";

/** What Sync would push. Mirrors SyncStatus in src-tauri/src/sync.rs. */
export type SyncStatus = {
  /** Filename -> "new" (not on GitHub yet) or "modified". */
  changes: Record<string, "new" | "modified">;
  /** Filenames deleted here but still on GitHub. */
  deleted: string[];
  /** Files renamed (and maybe edited a little) since the last sync. */
  renamed: { from: string; to: string }[];
};

/** What a sync did. Mirrors SyncReport in src-tauri/src/sync.rs. */
export type SyncReport = {
  pushed: number;
  /** Filenames whose content came from GitHub. */
  updated: string[];
  /** Filenames deleted because they were deleted on GitHub. */
  deleted: string[];
  /** Local copies kept under a new name because GitHub's version differed. */
  conflicts: string[];
  repoUrl: string;
};

export function syncStatus() {
  return invoke<SyncStatus>("sync_status");
}

/** Pulls from GitHub, then pushes every change as one commit. */
export function syncNow() {
  return invoke<SyncReport>("sync_now");
}

/** Brings down what changed on GitHub, without pushing (at sign-in). */
export function pullFromGitHub() {
  return invoke<SyncReport>("pull_from_github");
}

export function unsyncedCount(status: SyncStatus | undefined) {
  return status
    ? Object.keys(status.changes).length + status.deleted.length + status.renamed.length
    : 0;
}
