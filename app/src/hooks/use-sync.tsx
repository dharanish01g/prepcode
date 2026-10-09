import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readFile, readPractice, whenSavesSettled } from "@/lib/files";
import { disposeEditorModel, editorModelPath, setEditorModelText } from "@/lib/monaco";
import { queryKeys } from "@/lib/queries";
import {
  CONNECT_GITHUB,
  pullFromGitHub,
  syncNow,
  syncPractice,
  syncStatus,
  unsyncedCount,
  type SyncReport,
} from "@/lib/sync";

/** A practice answer's question and language: "practice/fizzbuzz.py" -> ["fizzbuzz", "py"]. */
function practiceParts(filename: string): [string, string] | null {
  if (!filename.startsWith("practice/")) return null;
  const name = filename.slice("practice/".length);
  const dot = name.indexOf(".");
  return [name.slice(0, dot), name.slice(dot + 1)];
}

/**
 * Syncing the signed-in student's files with their GitHub repo: everything
 * when they click Sync, and quietly every 15 minutes and on close
 * (backgroundSync); just the submitted answer on Submit (syncAnswer). One
 * sync runs at a time.
 */
export function useSync({
  userId,
  selectedFile,
  onSelectFile,
  flushEdits,
  onNeedsSetup,
}: {
  userId: string;
  selectedFile: string | null;
  onSelectFile: (filename: string | null) => void;
  /** Saves the editor's pending edits now, so they're included. */
  flushEdits: () => void;
  /** prepcode has no access to the student's repo (any more): set it up. */
  onNeedsSetup: () => void;
}) {
  const queryClient = useQueryClient();
  // True during the sign-in pull too: the editor is read-only meanwhile, so
  // nothing typed is overwritten by what comes from GitHub.
  const [syncing, setSyncing] = useState(false);
  // The sync running now, if any, so a second one waits for it instead.
  const inflight = useRef<Promise<boolean> | null>(null);

  // A report arrives long after the sync started: read the open file then,
  // not when it started. Refs also keep `pull` the same function across
  // renders (onSelectFile changes with the view), so the workspace's sign-in
  // pull runs once, not on every view switch.
  const selectedFileRef = useRef(selectedFile);
  const onSelectFileRef = useRef(onSelectFile);
  const onNeedsSetupRef = useRef(onNeedsSetup);
  const flushEditsRef = useRef(flushEdits);
  useLayoutEffect(() => {
    selectedFileRef.current = selectedFile;
    onSelectFileRef.current = onSelectFile;
    onNeedsSetupRef.current = onNeedsSetup;
    flushEditsRef.current = flushEdits;
  }, [selectedFile, onSelectFile, onNeedsSetup, flushEdits]);

  /** Runs `task` unless a sync is already running; then returns null. */
  const exclusive = useCallback((task: () => Promise<boolean>) => {
    if (inflight.current) return null;
    setSyncing(true);
    const running = task().finally(() => {
      inflight.current = null;
      setSyncing(false);
    });
    inflight.current = running;
    return running;
  }, []);

  // Shows what came from GitHub: new text in open files, deleted files closed.
  const applyReport = useCallback(
    async (report: SyncReport) => {
      for (const filename of report.updated) {
        const practice = practiceParts(filename);
        if (practice) {
          const content = (await readPractice(...practice)) ?? "";
          queryClient.setQueryData(queryKeys.practice(userId, ...practice), content);
          setEditorModelText(editorModelPath(userId, filename), content);
        } else {
          const content = await readFile(filename);
          queryClient.setQueryData(queryKeys.fileContent(userId, filename), content);
          setEditorModelText(editorModelPath(userId, filename), content);
        }
      }
      for (const filename of report.deleted) {
        const practice = practiceParts(filename);
        if (practice) {
          queryClient.removeQueries({ queryKey: queryKeys.practice(userId, ...practice) });
        } else {
          if (selectedFileRef.current === filename) flushSync(() => onSelectFileRef.current(null));
          queryClient.removeQueries({
            queryKey: queryKeys.fileContent(userId, filename),
            exact: true,
          });
        }
        disposeEditorModel(editorModelPath(userId, filename));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.files(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.fileHistory(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus(userId) }),
      ]);
      for (const copy of report.conflicts) {
        const original = copy.replace(/_conflict\d*(\.[^/]+)$/, "$1");
        toast.warning(`${original} also changed on GitHub`, {
          description: `GitHub's version is now ${original}. Your version was kept as ${copy}.`,
          duration: Infinity,
        });
      }
    },
    [queryClient, userId],
  );

  /** The Sync button: pull, then push everything as one commit. */
  function sync() {
    return (
      exclusive(async () => {
        try {
          flushEditsRef.current();
          await whenSavesSettled();
          const report = await syncNow();
          await applyReport(report);
          const received = report.updated.length + report.deleted.length;
          if (report.pushed === 0 && received === 0) {
            toast.success("Everything is already synced");
          } else {
            const parts = [];
            if (report.pushed > 0)
              parts.push(`${report.pushed} ${plural(report.pushed, "change")} saved to GitHub`);
            if (received > 0) parts.push(`${received} ${plural(received, "change")} from GitHub`);
            const id = toast.success("Synced", {
              description: parts.join(", ") + ".",
              action: (
                <Button
                  onClick={() => {
                    toast.dismiss(id);
                    openUrl(report.repoUrl);
                  }}
                >
                  View on GitHub
                </Button>
              ),
            });
          }
          return true;
        } catch (err) {
          const message = String(err);
          // Fixed on GitHub: the repo, or prepcode's access to it.
          if (message.startsWith(CONNECT_GITHUB)) onNeedsSetupRef.current();
          else toast.error("Couldn't sync", { description: message });
          return false;
        }
      }) ?? Promise.resolve(false)
    );
  }

  /**
   * Syncs everything quietly, without toasts: every 15 minutes, and on close.
   * Only talks to GitHub when something here changed, so it's free otherwise
   * (GitHub allows 500 writes an hour; each sync with changes is 3). If a sync
   * is already running, waits for that one. Resolves to whether it worked.
   */
  const backgroundSync = useCallback(
    () =>
      exclusive(async () => {
        try {
          flushEditsRef.current();
          await whenSavesSettled();
          if (unsyncedCount(await syncStatus()) === 0) return true;
          await applyReport(await syncNow());
          return true;
        } catch (err) {
          // Offline, or GitHub needs setting up: the next sync tries again,
          // and the Sync button says what's wrong.
          console.error("Background sync failed:", err);
          return false;
        }
      }) ??
      inflight.current ??
      Promise.resolve(false),
    [exclusive, applyReport],
  );

  /**
   * On Submit: sends just that answer, quietly, in its own commit (e.g.
   * "Submit Leap Year (Python)"). The student's other changes wait for the
   * next full sync. If a sync is running, goes after it.
   */
  const syncAnswer = useCallback(
    async (question: string, extension: string, message: string) => {
      while (inflight.current) await inflight.current;
      return (
        exclusive(async () => {
          try {
            flushEditsRef.current();
            await whenSavesSettled();
            await applyReport(await syncPractice(question, extension, message));
            return true;
          } catch (err) {
            // Offline, or GitHub needs setting up: a later sync sends it.
            console.error("Could not sync the answer:", err);
            return false;
          }
        }) ?? Promise.resolve(false)
      );
    },
    [exclusive, applyReport],
  );

  /** At sign-in: bring down the student's files, quietly. */
  const pull = useCallback(
    () =>
      exclusive(async () => {
        try {
          await applyReport(await pullFromGitHub());
          return true;
        } catch (err) {
          // Offline is fine: they'll sync later.
          console.error("Could not pull from GitHub:", err);
          if (String(err).startsWith(CONNECT_GITHUB)) onNeedsSetupRef.current();
          return false;
        }
      }) ?? Promise.resolve(false),
    [exclusive, applyReport],
  );

  return { syncing, sync, backgroundSync, syncAnswer, pull };
}

function plural(count: number, noun: string) {
  return count === 1 ? noun : `${noun}s`;
}
