import { useState } from "react";
import { DownloadIcon, LogOutIcon } from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

/**
 * A guest's files are deleted on log out and when prepcode closes, so make
 * sure they mean it, and let them export a zip of their files first.
 */
export function GuestLogoutDialog({
  action,
  onCancel,
  onExport,
  onConfirm,
}: {
  /** What's being held back; the dialog is open while this is set. */
  action: "log out" | "close" | null;
  onCancel: () => void;
  /** Zips the guest's files into Downloads; resolves to the zip's path. */
  onExport: () => Promise<string>;
  onConfirm: () => void;
}) {
  const [exporting, setExporting] = useState(false);

  // Stays open afterwards, so the guest can still log out or keep working.
  async function handleExport() {
    setExporting(true);
    try {
      const path = await onExport();
      const name = path.split(/[\\/]/).pop();
      toast.success("Files exported", {
        description: `Saved to Downloads as ${name}`,
        action: { label: "Show", onClick: () => revealItemInDir(path) },
      });
    } catch (err) {
      toast.error("Couldn't export your files", { description: String(err) });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AlertDialog open={action !== null} onOpenChange={(next) => !next && !exporting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <LogOutIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {action === "close" ? "Close prepcode?" : "Log out of guest mode?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            All your files will be deleted. Export them first to keep a copy as a zip in your
            Downloads folder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={exporting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="outline" disabled={exporting} onClick={handleExport}>
            {exporting ? <Spinner /> : <DownloadIcon />}
            Export
          </AlertDialogAction>
          <AlertDialogAction variant="destructive" disabled={exporting} onClick={onConfirm}>
            {action === "close" ? "Delete files and close" : "Delete files and log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
