import { ArrowRightIcon, ArrowUpIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { FileIcon } from "@/components/file-icon"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { SyncStatus } from "@/lib/sync"

const KINDS = {
  new: { icon: ArrowUpIcon, label: "New: not on GitHub yet" },
  modified: { icon: RefreshCwIcon, label: "Changed since the last sync" },
  deleted: { icon: Trash2Icon, label: "Deleted here: Sync removes it from GitHub" },
  renamed: { icon: PencilIcon, label: "Renamed since the last sync" },
}

/** The files Sync would push, like VS Code's Source Control list. */
export function SyncList({
  status,
  selectedFile,
  onSelectFile,
}: {
  status: SyncStatus | undefined
  selectedFile: string | null
  onSelectFile: (filename: string) => void
}) {
  if (!status) return null
  const entries: { file: string; from?: string; kind: keyof typeof KINDS }[] = [
    ...Object.entries(status.changes).map(([file, kind]) => ({ file, kind })),
    ...status.deleted.map((file) => ({ file, kind: "deleted" as const })),
    ...status.renamed.map(({ from, to }) => ({ file: to, from, kind: "renamed" as const })),
  ].sort((a, b) => a.file.toLowerCase().localeCompare(b.file.toLowerCase()))

  if (entries.length === 0) {
    return (
      <p className="px-4 py-2 text-sm text-muted-foreground">
        Everything is synced to GitHub.
      </p>
    )
  }

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {entries.map(({ file, from, kind }) => {
            const { icon: Icon, label } = KINDS[kind]
            const deleted = kind === "deleted"
            return (
              <SidebarMenuItem key={`${kind}:${file}`}>
                <SidebarMenuButton
                  isActive={!deleted && selectedFile === file}
                  disabled={deleted}
                  onClick={() => onSelectFile(file)}
                  title={label}
                >
                  <FileIcon filename={file} />
                  {from ? (
                    // Like GitHub: old.py → new.py
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="truncate text-muted-foreground">{from}</span>
                      <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file}</span>
                    </span>
                  ) : (
                    <span className={deleted ? "line-through" : undefined}>{file}</span>
                  )}
                  <Icon className="ml-auto text-muted-foreground" aria-label={label} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
