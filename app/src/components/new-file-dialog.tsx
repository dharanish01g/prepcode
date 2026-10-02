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
import { Spinner } from "@/components/ui/spinner";
import { FileIcon } from "@/components/file-icon";
import { DownloadIcon } from "lucide-react";
import { fileNameError } from "@/lib/files";
import { getLanguages } from "@/lib/languages";
import { useCreateFileMutation } from "@/lib/queries";
import {
  progressLabel,
  sameRuntime,
  useInstalledRuntimes,
  useInstallingRuntimes,
  useInstallRuntimeMutation,
  useRuntimeProgress,
} from "@/lib/runtimes";

export function NewFileDialog({
  open,
  onOpenChange,
  userId,
  existingFiles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New file</DialogTitle>
          <DialogDescription>Give your program a name and pick its language.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets each time. */}
        {open && (
          <NewFileForm userId={userId} existingFiles={existingFiles} onCreated={onCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewFileForm({
  userId,
  existingFiles,
  onCreated,
}: {
  userId: string;
  existingFiles: string[];
  onCreated: (filename: string) => void;
}) {
  const [name, setName] = useState("");
  const [pickedExtension, setExtension] = useState<string | null>(null);
  const createFile = useCreateFileMutation(userId);
  const submitting = createFile.isPending;

  const runtimes = useInstalledRuntimes();
  const languages = getLanguages();
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
        <Label htmlFor="file-language">Language</Label>
        <Select
          items={languages.map((lang) => ({ value: lang.extension, label: lang.name }))}
          value={extension}
          onValueChange={(value) => {
            if (value) setExtension(value);
            createFile.reset();
          }}
        >
          <SelectTrigger id="file-language" className="w-full" disabled={runtimes.isPending}>
            <SelectValue placeholder="Select a language" />
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
        <p className="text-xs text-muted-foreground">
          No languages installed yet. Open Language and download one to get started.
        </p>
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

/**
 * A greyed-out, unselectable language with a Download button. Not a SelectItem:
 * disabled items ignore clicks, which would also block the button.
 */
function NotInstalledRow({
  extension,
  label,
  onInstalled,
}: {
  extension: string;
  label: string;
  onInstalled: () => void;
}) {
  const install = useInstallRuntimeMutation();
  // C and C++ share one download, so either one downloading covers both rows.
  const downloadingAs = useInstallingRuntimes().find((ext) => sameRuntime(ext, extension));
  const downloading = downloadingAs !== undefined;
  const progress = useRuntimeProgress(downloadingAs ?? extension);

  return (
    <div className="flex flex-col gap-1 py-1 pr-1 pl-2 text-xs">
      <div className="flex items-center gap-2">
        <FileIcon extension={extension} className="opacity-60 grayscale" />
        <span className="flex-1 text-muted-foreground opacity-60">{label}</span>
        {downloading && (
          <span className="text-muted-foreground tabular-nums">{progressLabel(progress)}</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          disabled={downloading}
          aria-label={downloading ? `Downloading ${label}` : `Download ${label}`}
          onClick={() => install.mutate(extension, { onSuccess: onInstalled })}
        >
          {downloading ? <Spinner /> : <DownloadIcon />}
        </Button>
      </div>
      {install.isError && !downloading && (
        <p className="pr-1 text-destructive">{String(install.error)}</p>
      )}
    </div>
  );
}
