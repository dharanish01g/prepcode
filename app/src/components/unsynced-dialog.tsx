import { CloudOffIcon } from "lucide-react";
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
 * Before logging out or closing with changes that aren't on GitHub yet.
 * Unsynced files aren't lost either way: they stay on this computer and can
 * be synced at the student's next sign-in here.
 */
export function UnsyncedDialog({
  action,
  count,
  syncing,
  onCancel,
  onProceed,
  onSyncAndProceed,
}: {
  /** What's being held back; the dialog is open while this is set. */
  action: "log out" | "close" | null;
  count: number;
  syncing: boolean;
  onCancel: () => void;
  /** Go ahead without syncing. */
  onProceed: () => void;
  onSyncAndProceed: () => void;
}) {
  const changes = count === 1 ? "1 change isn't" : `${count} changes aren't`;
  return (
    <AlertDialog open={action !== null} onOpenChange={(next) => !next && !syncing && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-amber-600 dark:text-amber-400">
            <CloudOffIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{changes} synced to GitHub</AlertDialogTitle>
          <AlertDialogDescription>
            Sync now to save them to GitHub. If you {action} without syncing, they stay only on this
            computer until you sign in here again and sync.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={syncing}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="outline" disabled={syncing} onClick={onProceed}>
            {action === "log out" ? "Log out anyway" : "Close anyway"}
          </AlertDialogAction>
          <AlertDialogAction disabled={syncing} onClick={onSyncAndProceed}>
            {syncing && <Spinner />}
            {action === "log out" ? "Sync and log out" : "Sync and close"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
