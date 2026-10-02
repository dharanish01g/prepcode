import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readFile, whenSavesSettled } from "@/lib/files";
import { disposeEditorModel, editorModelPath, setEditorModelText } from "@/lib/monaco";
import { queryKeys } from "@/lib/queries";
import { pullFromGitHub, syncNow, type SyncReport } from "@/lib/sync";

/** Syncing the signed-in student's files with their GitHub repo. */
export function useSync({
  userId,
  selectedFile,
  onSelectFile,
  flushEdits,
}: {
  userId: string;
  selectedFile: string | null;
  onSelectFile: (filename: string | null) => void;
  /** Saves the editor's pending edits now, so they're included. */
  flushEdits: () => void;
}) {
  const queryClient = useQueryClient();
  // True during the sign-in pull too: the editor is read-only meanwhile, so
  // nothing typed is overwritten by what comes from GitHub.
  const [syncing, setSyncing] = useState(false);

  // A report arrives long after the sync started: read the open file then,
  // not when it started.
  const selectedFileRef = useRef(selectedFile);
  useLayoutEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  // Shows what came from GitHub: new text in open files, deleted files closed.
  const applyReport = useCallback(
    async (report: SyncReport) => {
      for (const filename of report.updated) {
        const content = await readFile(filename);
        queryClient.setQueryData(queryKeys.fileContent(userId, filename), content);
        setEditorModelText(editorModelPath(userId, filename), content);
      }
      for (const filename of report.deleted) {
        if (selectedFileRef.current === filename) flushSync(() => onSelectFile(null));
        queryClient.removeQueries({
          queryKey: queryKeys.fileContent(userId, filename),
          exact: true,
        });
        disposeEditorModel(editorModelPath(userId, filename));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.files(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.fileHistory(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus(userId) }),
      ]);
      for (const copy of report.conflicts) {
        const original = copy.replace(/_conflict\d*(\.[^.]+)$/, "$1");
        toast.warning(`${original} also changed on GitHub`, {
          description: `GitHub's version is now ${original}. Your version was kept as ${copy}.`,
          duration: Infinity,
        });
      }
    },
    [queryClient, userId, onSelectFile],
  );

  /** The Sync button: pull, then push everything as one commit. */
  async function sync() {
    if (syncing) return false;
    setSyncing(true);
    try {
      flushEdits();
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
      toast.error("Couldn't sync", { description: String(err) });
      return false;
    } finally {
      setSyncing(false);
    }
  }

  /** At sign-in: bring down the student's files, quietly. */
  const pull = useCallback(async () => {
    setSyncing(true);
    try {
      const report = await pullFromGitHub();
      await applyReport(report);
    } catch (err) {
      // Offline is fine: they'll sync later.
      console.error("Could not pull from GitHub:", err);
    } finally {
      setSyncing(false);
    }
  }, [applyReport]);

  return { syncing, sync, pull };
}

function plural(count: number, noun: string) {
  return count === 1 ? noun : `${noun}s`;
}
