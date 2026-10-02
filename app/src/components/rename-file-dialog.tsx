import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extensionOf, fileNameError } from "@/lib/files";
import { useRenameFileMutation } from "@/lib/queries";

export function RenameFileDialog({
  filename,
  userId,
  existingFiles,
  onClose,
  beforeRename,
  onRenamed,
}: {
  /** The file being renamed; the dialog is open while this is set. */
  filename: string | null;
  userId: string;
  existingFiles: string[];
  onClose: () => void;
  /** Runs right before renaming, e.g. to save pending edits first. */
  beforeRename: () => void;
  onRenamed: (oldFilename: string, newFilename: string) => void;
}) {
  return (
    <Dialog open={filename !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rename file</DialogTitle>
          <DialogDescription>The language stays the same, only the name changes.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets each time. */}
        {filename && (
          <RenameFileForm
            filename={filename}
            userId={userId}
            existingFiles={existingFiles}
            beforeRename={beforeRename}
            onRenamed={onRenamed}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameFileForm({
  filename,
  userId,
  existingFiles,
  beforeRename,
  onRenamed,
}: {
  filename: string;
  userId: string;
  existingFiles: string[];
  beforeRename: () => void;
  onRenamed: (oldFilename: string, newFilename: string) => void;
}) {
  const extension = extensionOf(filename);
  const [name, setName] = useState(filename.slice(0, -(extension.length + 1)));
  const rename = useRenameFileMutation(userId);

  const trimmed = name.trim();
  const newFilename = `${trimmed}.${extension}`;
  const unchanged = newFilename === filename;
  // A case-only change (hello -> Hello) renames the same file, so it's allowed.
  const isDuplicate = existingFiles.some(
    (f) =>
      f.toLowerCase() === newFilename.toLowerCase() && f.toLowerCase() !== filename.toLowerCase(),
  );
  const nameError =
    fileNameError(trimmed) ?? (isDuplicate ? `${newFilename} already exists.` : null);
  const canRename = trimmed !== "" && !unchanged && !nameError && !rename.isPending;
  const error = nameError ?? (rename.isError ? String(rename.error) : null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRename) return;
    beforeRename();
    rename.mutate(
      { filename, newName: trimmed },
      { onSuccess: (renamed) => onRenamed(filename, renamed) },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="rename-file">File name</Label>
        <Input
          id="rename-file"
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
            rename.reset();
          }}
          // Select the name so typing replaces it, like renaming in VS Code.
          onFocus={(e) => e.currentTarget.select()}
          autoComplete="off"
          autoFocus
          maxLength={64}
          aria-invalid={nameError ? true : undefined}
          className="h-9"
        />
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        trimmed &&
        !unchanged && (
          <p className="text-xs text-muted-foreground">Will be renamed to {newFilename}</p>
        )
      )}

      <DialogFooter>
        <Button type="submit" size="lg" className="w-full" disabled={!canRename}>
          Rename
        </Button>
      </DialogFooter>
    </form>
  );
}
