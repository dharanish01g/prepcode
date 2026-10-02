"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { NavUser } from "@/components/nav-user";
import { DeleteFileDialog } from "@/components/delete-file-dialog";
import { HistoryList } from "@/components/history-list";
import { SyncList } from "@/components/sync-list";
import { NewFileDialog } from "@/components/new-file-dialog";
import { RenameFileDialog } from "@/components/rename-file-dialog";
import { ZoomMenu } from "@/components/zoom-menu";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { displayName, type Session } from "@/lib/auth";
import { disposeEditorModel, editorModelPath } from "@/lib/monaco";
import { useFilesQuery } from "@/lib/queries";
import type { SyncStatus } from "@/lib/sync";
import { FilesIcon, PlusIcon, MoonIcon, RefreshCwIcon, SunIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";

const data = {
  navMain: [
    // Every program by when it was last edited, newest first.
    { title: "Programs", icon: <FilesIcon /> },
    // What isn't on GitHub yet, and the Sync button. Students only.
    { title: "Sync", icon: <RefreshCwIcon /> },
  ],
};

export function AppSidebar({
  session,
  onLogout,
  selectedFile,
  onSelectFile,
  onFlushEdits,
  syncStatus,
  unsynced,
  syncing,
  onSync,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session;
  onLogout: () => void;
  selectedFile: string | null;
  onSelectFile: (filename: string | null) => void;
  /** Saves the editor's pending edits now (before a rename or delete). */
  onFlushEdits: () => void;
  /** What isn't synced to GitHub yet; undefined for guests. */
  syncStatus?: SyncStatus;
  /** Changes Sync would push, including deletions. */
  unsynced: number;
  syncing: boolean;
  onSync: () => void;
}) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const navItems = data.navMain.filter((item) => !session.guest || item.title !== "Sync");
  const { setOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const filesQuery = useFilesQuery(session.id);
  const files = filesQuery.data ?? [];
  const [search, setSearch] = React.useState("");
  const [newFileOpen, setNewFileOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // Moves the editor off `oldFile` (synchronously, so Monaco has switched
  // models), then frees its model so a future file with that name starts fresh.
  function releaseFile(oldFile: string, next: string | null) {
    if (selectedFile === oldFile) flushSync(() => onSelectFile(next));
    disposeEditorModel(editorModelPath(session.id, oldFile));
  }

  const query = search.trim().toLowerCase();

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="md:h-8 md:p-0" render={<a href="#" />}>
                <img src={logo} alt="" className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">prepcode</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              {/* gap-2 matches the footer's icons below. */}
              <SidebarMenu className="gap-2">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        setOpen(true);
                      }}
                      isActive={activeItem.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.title === "Sync" && unsynced > 0 ? (
                        // How many changes aren't on GitHub yet, at the
                        // icon's bottom-right corner.
                        <span className="relative flex shrink-0 [&>svg]:size-4">
                          {item.icon}
                          <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-bold text-white tabular-nums">
                            {unsynced}
                          </span>
                        </span>
                      ) : (
                        item.icon
                      )}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* gap-2 matches the footer's own gap, so all footer items are evenly spaced. */}
          <SidebarMenu className="gap-2">
            <ZoomMenu />
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={{
                  children: theme === "dark" ? "Light theme" : "Dark theme",
                  hidden: false,
                }}
                onClick={toggleTheme}
                className="px-2.5 md:px-2"
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <NavUser name={displayName(session)} avatarUrl={session.avatarUrl} onLogout={onLogout} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">{activeItem.title}</div>
            {activeItem.title === "Sync" ? (
              <Button
                size="sm"
                disabled={syncing}
                onClick={onSync}
                title="Save your changes to GitHub"
              >
                {syncing ? <Spinner /> : <RefreshCwIcon />}
                Sync
              </Button>
            ) : (
              <Button size="sm" onClick={() => setNewFileOpen(true)}>
                <PlusIcon />
                New file
              </Button>
            )}
            <NewFileDialog
              open={newFileOpen}
              onOpenChange={setNewFileOpen}
              userId={session.id}
              existingFiles={files}
              onCreated={(filename) => {
                onSelectFile(filename);
                setSearch("");
                setNewFileOpen(false);
              }}
            />
          </div>
          {activeItem.title === "Programs" && (
            <SidebarInput
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          )}
        </SidebarHeader>
        <SidebarContent className="py-2">
          {activeItem.title === "Sync" ? (
            <SyncList status={syncStatus} selectedFile={selectedFile} onSelectFile={onSelectFile} />
          ) : (
            <HistoryList
              userId={session.id}
              search={query}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onRename={setRenaming}
              onDelete={setDeleting}
            />
          )}
        </SidebarContent>
      </Sidebar>

      <RenameFileDialog
        filename={renaming}
        userId={session.id}
        existingFiles={files}
        onClose={() => setRenaming(null)}
        beforeRename={onFlushEdits}
        onRenamed={(oldFile, newFile) => {
          setRenaming(null);
          releaseFile(oldFile, newFile);
        }}
      />
      <DeleteFileDialog
        filename={deleting}
        userId={session.id}
        onClose={() => setDeleting(null)}
        beforeDelete={onFlushEdits}
        onDeleted={(file) => {
          setDeleting(null);
          releaseFile(file, null);
        }}
      />
    </Sidebar>
  );
}
