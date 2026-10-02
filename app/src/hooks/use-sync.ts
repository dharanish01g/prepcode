import { useState } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
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
  const [syncing, setSyncing] = useState(false);

  // Shows what came from GitHub: new text in open files, deleted files closed.
  async function applyReport(report: SyncReport) {
    for (const filename of report.updated) {
      const content = await readFile(filename);
      queryClient.setQueryData(queryKeys.fileContent(userId, filename), content);
      setEditorModelText(editorModelPath(userId, filename), content);
    }
    for (const filename of report.deleted) {
      if (selectedFile === filename) flushSync(() => onSelectFile(null));
      queryClient.removeQueries({ queryKey: queryKeys.fileContent(userId, filename), exact: true });
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
  }

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
        if (report.pushed > 0) parts.push(`${report.pushed} ${plural(report.pushed, "change")} saved to GitHub`);
        if (received > 0) parts.push(`${received} ${plural(received, "change")} from GitHub`);
        toast.success("Synced", {
          description: parts.join(", ") + ".",
          action: { label: "View on GitHub", onClick: () => openUrl(report.repoUrl) },
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
  async function pull() {
    try {
      const report = await pullFromGitHub();
      await applyReport(report);
    } catch (err) {
      // Offline is fine: they'll sync later.
      console.error("Could not pull from GitHub:", err);
    }
  }

  return { syncing, sync, pull };
}

function plural(count: number, noun: string) {
  return count === 1 ? noun : `${noun}s`;
}
