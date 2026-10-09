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
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileIcon } from "@/components/file-icon";
import { NotInstalledRow } from "@/components/not-installed-row";
import { fileNameError } from "@/lib/files";
import { getLanguages, type Language } from "@/lib/languages";
import { useCreateFileMutation } from "@/lib/queries";
import { useInstalledRuntimes } from "@/lib/runtimes";

/** Wording for each kind of file: a program in a language, or queries for a database. */
const KINDS = {
  program: {
    description: "Give your program a name and pick its language.",
    label: "Language",
    placeholder: "Select a language",
    noneInstalled: "No languages installed yet. Open Language and download one to get started.",
  },
  database: {
    description: "Give your file a name and pick its database.",
    label: "Database",
    placeholder: "Select a database",
    noneInstalled: "No databases installed yet. Open Database and download one to get started.",
  },
};

export function NewFileDialog({
  open,
  onOpenChange,
  kind,
  userId,
  existingFiles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Offer languages (Programs) or databases (Database). */
  kind: Language["kind"];
  userId: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New file</DialogTitle>
          <DialogDescription>{KINDS[kind].description}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets each time. */}
        {open && (
          <NewFileForm
            kind={kind}
            userId={userId}
            existingFiles={existingFiles}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewFileForm({
  kind,
  userId,
  existingFiles,
  onCreated,
}: {
  kind: Language["kind"];
  userId: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  const [name, setName] = useState("");
  const [pickedExtension, setExtension] = useState<string | null>(null);
  const createFile = useCreateFileMutation(userId);
  const submitting = createFile.isPending;

  const runtimes = useInstalledRuntimes();
  const languages = getLanguages(kind);
  const text = KINDS[kind];
  const installed = languages.filter((lang) => runtimes.data?.includes(lang.extension));
  const notInstalled = languages.filter((lang) => !runtimes.data?.includes(lang.extension));
  // Default to the first installed language until the student picks one.
  const extension = pickedExtension ?? installed[0]?.extension ?? null;

  const trimmed = name.trim();
  const filename = extension ? `${trimmed}.${extension}` : trimmed;
  const isDuplicate =
    trimmed !== "" && existingFiles.some((f) => f.toLowerCase() === filename.toLowerCase());
  const nameError = fileNameError(trimmed) ?? (isDuplicate ? `${filename} already exists.` : null);
  const canCreate = trimmed !== "" && extension !== null && !nameError && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || !extension) return;
    createFile.mutate({ name: trimmed, extension }, { onSuccess: onCreated });
  }

  // Without this, a failed check would quietly list everything as not installed.
  const error =
    nameError ??
    (createFile.isError ? String(createFile.error) : null) ??
    (runtimes.isError ? `Could not check what's installed: ${String(runtimes.error)}` : null);

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
        <Label htmlFor="file-language">{text.label}</Label>
        <Select
          items={languages.map((lang) => ({ value: lang.extension, label: lang.name }))}
          value={extension}
          onValueChange={(value) => {
            if (value) setExtension(value);
            createFile.reset();
          }}
        >
          <SelectTrigger id="file-language" className="w-full" disabled={runtimes.isPending}>
            <SelectValue placeholder={text.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {installed.length > 0 && (
              <SelectGroup>
                <SelectLabel>Installed</SelectLabel>
                {installed.map((lang) => (
                  <SelectItem key={lang.extension} value={lang.extension}>
                    <FileIcon extension={lang.extension} />
                    {lang.name} (.{lang.extension})
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {installed.length > 0 && notInstalled.length > 0 && <SelectSeparator />}
            {notInstalled.length > 0 && (
              <SelectGroup>
                <SelectLabel>Not installed</SelectLabel>
                {notInstalled.map((lang) => (
                  <NotInstalledRow
                    key={lang.extension}
                    extension={lang.extension}
                    label={`${lang.name} (.${lang.extension})`}
                    onInstalled={() => setExtension(lang.extension)}
                  />
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : extension === null && runtimes.isSuccess ? (
        <p className="text-xs text-muted-foreground">{text.noneInstalled}</p>
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
