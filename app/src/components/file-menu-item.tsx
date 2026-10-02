import { PencilIcon, Trash2Icon } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

/** A file in the sidebar: click to open, right-click to rename or delete. */
export function FileMenuItem({
  file,
  isActive,
  detail,
  onSelect,
  onRename,
  onDelete,
}: {
  file: string;
  isActive: boolean;
  /** Small text on the right, e.g. the time it was last edited. */
  detail?: string;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <SidebarMenuItem>
      <ContextMenu>
        <ContextMenuTrigger render={<SidebarMenuButton isActive={isActive} onClick={onSelect} />}>
          <FileIcon filename={file} />
          <span>{file}</span>
          {detail && (
            <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
              {detail}
            </span>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-40">
          <ContextMenuItem onClick={onRename}>
            <PencilIcon />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  );
}
