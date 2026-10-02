import { useRef } from "react";
import { Trash2Icon } from "lucide-react";
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
import { useDeleteFileMutation } from "@/lib/queries";

export function DeleteFileDialog({
  filename,
  userId,
  onClose,
  beforeDelete,
  onDeleted,
}: {
  /** The file being deleted; the dialog is open while this is set. */
  filename: string | null;
  userId: string;
  onClose: () => void;
  /** Runs right before deleting, e.g. to save pending edits first. */
  beforeDelete: () => void;
  onDeleted: (filename: string) => void;
}) {
  const remove = useDeleteFileMutation(userId);
  // Keeps the name in the title while the dialog animates closed.
  const shown = useRef(filename);
  if (filename) shown.current = filename;

  return (
    <AlertDialog
      open={filename !== null}
      onOpenChange={(open) => {
        if (!open && !remove.isPending) {
          remove.reset();
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {shown.current}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the file and its code. It can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && <p className="text-xs text-destructive">{String(remove.error)}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (!filename) return;
              beforeDelete();
              remove.mutate(filename, {
                onSuccess: () => {
                  remove.reset();
                  onDeleted(filename);
                },
              });
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
