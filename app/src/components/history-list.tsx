import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { FileMenuItem } from "@/components/file-menu-item";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import type { FileHistoryEntry } from "@/lib/files";
import { useFileHistoryQuery } from "@/lib/queries";

function dayLabel(day: Date) {
  if (isToday(day)) return "Today";
  if (isYesterday(day)) return "Yesterday";
  return format(day, "EEE, dd MMM yyyy");
}

/** Entries are already newest first, so days come out newest first too. */
function groupByDay(entries: FileHistoryEntry[]) {
  const groups: { day: Date; entries: FileHistoryEntry[] }[] = [];
  for (const entry of entries) {
    const day = startOfDay(entry.modified);
    const last = groups[groups.length - 1];
    if (last && last.day.getTime() === day.getTime()) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

/** Every program, grouped by the day it was last edited, newest first. */
export function HistoryList({
  userId,
  search,
  selectedFile,
  onSelectFile,
  onRename,
  onDelete,
}: {
  userId: string;
  /** Lowercased search text; empty shows everything. */
  search: string;
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
  onRename: (filename: string) => void;
  onDelete: (filename: string) => void;
}) {
  const history = useFileHistoryQuery(userId);

  if (history.isError) {
    return (
      <p className="px-4 py-2 text-sm text-destructive">
        Could not load your history: {String(history.error)}
      </p>
    );
  }
  if (!history.isSuccess) return null;

  const entries = history.data.filter((e) => e.filename.toLowerCase().includes(search));
  if (entries.length === 0) {
    return (
      <p className="px-4 py-2 text-sm text-muted-foreground">
        {history.data.length === 0
          ? "No programs yet. Click New file to create one."
          : "No files match your search."}
      </p>
    );
  }

  return groupByDay(entries).map(({ day, entries }) => (
    // Vertical padding lives on SidebarContent so groups sit close together.
    <SidebarGroup key={day.getTime()} className="py-0">
      <SidebarGroupLabel>{dayLabel(day)}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {entries.map(({ filename, modified }) => (
            <FileMenuItem
              key={filename}
              file={filename}
              isActive={selectedFile === filename}
              detail={format(modified, "h:mm a")}
              onSelect={() => onSelectFile(filename)}
              onRename={() => onRename(filename)}
              onDelete={() => onDelete(filename)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
