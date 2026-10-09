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

/**
 * Syncs one practice answer alone (on Submit): only that file is pulled and
 * pushed, committed with `message`. Everything else waits for a full sync.
 */
export function syncPractice(question: string, extension: string, message: string) {
  return invoke<SyncReport>("sync_practice", { question, extension, message });
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

/** How sync errors that are fixed on GitHub start (see account.rs). */
export const CONNECT_GITHUB = "Connect GitHub:";

/** Whether the student's GitHub is ready for syncing. Mirrors RepoSetup in sync.rs. */
export type RepoSetup =
  | { kind: "ready" }
  /** Install the prepcodes app at `url`; prepcode then creates the repo if there isn't one. */
  | { kind: "needsInstall"; url: string }
  /** Give the installed app the existing repo at `url` (only that repo selected). */
  | { kind: "needsAccess"; url: string }
  /** Accept the app's newer permissions at `url`, so it can create the repo. */
  | { kind: "needsApproval"; url: string }
  /** Couldn't find out, e.g. offline. */
  | { kind: "unknown"; message: string };

/**
 * Checks the student's repo access. Once the prepcodes app is installed, this
 * also creates their repo if they don't have one. Called again until it's ready.
 */
export function repoSetup() {
  return invoke<RepoSetup>("repo_setup");
}
