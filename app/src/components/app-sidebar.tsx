"use client"

import * as React from "react"
import { flushSync } from "react-dom"

import { NavUser } from "@/components/nav-user"
import { DeleteFileDialog } from "@/components/delete-file-dialog"
import { FileIcon } from "@/components/file-icon"
import { FileMenuItem } from "@/components/file-menu-item"
import { HistoryList } from "@/components/history-list"
import { NewFileDialog } from "@/components/new-file-dialog"
import { RenameFileDialog } from "@/components/rename-file-dialog"
import { ZoomMenu } from "@/components/zoom-menu"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { displayName, type Session } from "@/lib/auth"
import { extensionOf } from "@/lib/files"
import { getLanguages, type Language } from "@/lib/languages"
import { disposeEditorModel, editorModelPath } from "@/lib/monaco"
import { useFilesQuery } from "@/lib/queries"
import {
  FileIcon as FileLucideIcon,
  InboxIcon,
  PlusIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import logo from "@/assets/logo.png"

const data = {
  navMain: [
    // Every program by when it was last edited, newest first. Shown first.
    { title: "Programs", icon: <FileLucideIcon /> },
    // Programs grouped by language.
    { title: "Languages", icon: <InboxIcon /> },
  ],
}

export function AppSidebar({
  session,
  onLogout,
  selectedFile,
  onSelectFile,
  onFlushEdits,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session
  onLogout: () => void
  selectedFile: string | null
  onSelectFile: (filename: string | null) => void
  /** Saves the editor's pending edits now (before a rename or delete). */
  onFlushEdits: () => void
}) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const { setOpen } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const filesQuery = useFilesQuery(session.reg_no)
  const files = filesQuery.data ?? []
  const [search, setSearch] = React.useState("")
  const [newFileOpen, setNewFileOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  // Moves the editor off `oldFile` (synchronously, so Monaco has switched
  // models), then frees its model so a future file with that name starts fresh.
  function releaseFile(oldFile: string, next: string | null) {
    if (selectedFile === oldFile) flushSync(() => onSelectFile(next))
    disposeEditorModel(editorModelPath(session.reg_no, oldFile))
  }

  // One category per language that has files, in catalog order.
  const query = search.trim().toLowerCase()
  const categories = getLanguages().map((lang) => ({
    ...lang,
    files: files.filter(
      (f) => extensionOf(f) === lang.extension && f.toLowerCase().includes(query)
    ),
  })).filter((category) => category.files.length > 0)

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="md:h-8 md:p-0"
                render={<a href="#" />}
              >
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
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        setOpen(true)
                      }}
                      isActive={activeItem.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.icon}
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
          <NavUser name={displayName(session)} onLogout={onLogout} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem.title}
            </div>
            <Button size="sm" onClick={() => setNewFileOpen(true)}>
              <PlusIcon />
              New file
            </Button>
            <NewFileDialog
              open={newFileOpen}
              onOpenChange={setNewFileOpen}
              regNo={session.reg_no}
              existingFiles={files}
              onCreated={(filename) => {
                onSelectFile(filename)
                setSearch("")
                setNewFileOpen(false)
              }}
            />
          </div>
          <SidebarInput
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </SidebarHeader>
        <SidebarContent className="py-2">
          {activeItem.title === "Programs" ? (
            <HistoryList
              regNo={session.reg_no}
              search={query}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onRename={setRenaming}
              onDelete={setDeleting}
            />
          ) : (
            <ProgramsList
              isError={filesQuery.isError}
              error={filesQuery.error}
              isSuccess={filesQuery.isSuccess}
              hasFiles={files.length > 0}
              categories={categories}
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
        regNo={session.reg_no}
        existingFiles={files}
        onClose={() => setRenaming(null)}
        beforeRename={onFlushEdits}
        onRenamed={(oldFile, newFile) => {
          setRenaming(null)
          releaseFile(oldFile, newFile)
        }}
      />
      <DeleteFileDialog
        filename={deleting}
        regNo={session.reg_no}
        onClose={() => setDeleting(null)}
        beforeDelete={onFlushEdits}
        onDeleted={(file) => {
          setDeleting(null)
          releaseFile(file, null)
        }}
      />
    </Sidebar>
  )
}

type Category = Language & { files: string[] }

/** Files grouped by language, each group collapsible. */
function ProgramsList({
  isError,
  error,
  isSuccess,
  hasFiles,
  categories,
  selectedFile,
  onSelectFile,
  onRename,
  onDelete,
}: {
  isError: boolean
  error: unknown
  isSuccess: boolean
  hasFiles: boolean
  categories: Category[]
  selectedFile: string | null
  onSelectFile: (filename: string) => void
  onRename: (filename: string) => void
  onDelete: (filename: string) => void
}) {
  return (
    <>
      {isError ? (
        <p className="px-4 py-2 text-sm text-destructive">
          Could not load your files: {String(error)}
        </p>
      ) : (
        isSuccess &&
        categories.length === 0 && (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            {!hasFiles
              ? "No programs yet. Click New file to create one."
              : "No files match your search."}
          </p>
        )
      )}
      {categories.map((category) => (
        <Collapsible key={category.extension} defaultOpen>
          {/* Vertical padding lives on SidebarContent so groups sit close together. */}
          <SidebarGroup className="py-0">
            <SidebarGroupLabel
              render={<CollapsibleTrigger />}
              className="group/label w-full gap-2"
            >
              <ChevronRightIcon className="transition-transform group-data-panel-open/label:rotate-90" />
              <FileIcon extension={category.extension} />
              {category.name}
              <span className="ml-auto">{category.files.length}</span>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.files.map((file) => (
                    <FileMenuItem
                      key={file}
                      file={file}
                      isActive={selectedFile === file}
                      onSelect={() => onSelectFile(file)}
                      onRename={() => onRename(file)}
                      onDelete={() => onDelete(file)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ))}
    </>
  )
}
