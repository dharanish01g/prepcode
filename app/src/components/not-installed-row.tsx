import { DownloadIcon } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  progressLabel,
  sameRuntime,
  useInstallingRuntimes,
  useInstallRuntimeMutation,
  useRuntimeProgress,
} from "@/lib/runtimes";

/**
 * A greyed-out, unselectable language with a Download button. Not a SelectItem:
 * disabled items ignore clicks, which would also block the button.
 */
export function NotInstalledRow({
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
