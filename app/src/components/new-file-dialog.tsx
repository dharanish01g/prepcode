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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fileNameError, LANGUAGES, type Extension } from "@/lib/files";
import { useCreateFileMutation } from "@/lib/queries";

export function NewFileDialog({
  open,
  onOpenChange,
  regNo,
  existingFiles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regNo: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New file</DialogTitle>
          <DialogDescription>Give your program a name and pick its language.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets each time. */}
        {open && (
          <NewFileForm regNo={regNo} existingFiles={existingFiles} onCreated={onCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewFileForm({
  regNo,
  existingFiles,
  onCreated,
}: {
  regNo: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  const [name, setName] = useState("");
  const [extension, setExtension] = useState<Extension>("py");
  const createFile = useCreateFileMutation(regNo);
  const submitting = createFile.isPending;

  const trimmed = name.trim();
  const filename = `${trimmed}.${extension}`;
  const isDuplicate =
    trimmed !== "" && existingFiles.some((f) => f.toLowerCase() === filename.toLowerCase());
  const nameError = fileNameError(trimmed) ?? (isDuplicate ? `${filename} already exists.` : null);
  const canCreate = trimmed !== "" && !nameError && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    createFile.mutate({ name: trimmed, extension }, { onSuccess: onCreated });
  }

  const error = nameError ?? (createFile.isError ? String(createFile.error) : null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file-name">File name</Label>
        <Input
          id="file-name"
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
            createFile.reset();
          }}
          placeholder="e.g. hello"
          autoComplete="off"
          autoFocus
          maxLength={64}
          aria-invalid={nameError ? true : undefined}
          className="h-9"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="file-type">Type</Label>
        <Select
          items={LANGUAGES}
          value={extension}
          onValueChange={(value) => {
            if (value) setExtension(value);
            createFile.reset();
          }}
        >
          <SelectTrigger id="file-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label} (.{lang.value})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        trimmed && <p className="text-xs text-muted-foreground">Will be saved as {filename}</p>
      )}

      <DialogFooter>
        <Button type="submit" size="lg" className="w-full" disabled={!canCreate}>
          Create file
        </Button>
      </DialogFooter>
    </form>
  );
}
