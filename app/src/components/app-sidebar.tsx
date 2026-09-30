"use client"

import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { NewFileDialog } from "@/components/new-file-dialog"
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
import type { Session } from "@/lib/auth"
import { extensionOf, LANGUAGES } from "@/lib/files"
import { useFilesQuery } from "@/lib/queries"
import {
  InboxIcon,
  PlusIcon,
  ChevronRightIcon,
  FileCodeIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import logo from "@/assets/logo.png"

const data = {
  navMain: [
    {
      title: "Programs",
      url: "#",
      icon: (
        <InboxIcon
        />
      ),
      isActive: true,
    },
  ],
}

export function AppSidebar({
  session,
  onLogout,
  selectedFile,
  onSelectFile,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session
  onLogout: () => void
  selectedFile: string | null
  onSelectFile: (filename: string) => void
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

  // One category per language that has files, in LANGUAGES order.
  const query = search.trim().toLowerCase()
  const categories = LANGUAGES.map((lang) => ({
    ...lang,
    files: files.filter(
      (f) => extensionOf(f) === lang.value && f.toLowerCase().includes(query)
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
                      isActive={activeItem?.title === item.title}
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
          <SidebarMenu>
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
          <NavUser regNo={session.reg_no} onLogout={onLogout} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem?.title}
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
          {filesQuery.isError ? (
            <p className="px-4 py-2 text-sm text-destructive">
              Could not load your files: {String(filesQuery.error)}
            </p>
          ) : (
            filesQuery.isSuccess &&
            categories.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">
                {files.length === 0
                  ? "No programs yet. Click New file to create one."
                  : "No files match your search."}
              </p>
            )
          )}
          {categories.map((category) => (
            <Collapsible key={category.value} defaultOpen>
              {/* Vertical padding lives on SidebarContent so groups sit close together. */}
              <SidebarGroup className="py-0">
                <SidebarGroupLabel
                  render={<CollapsibleTrigger />}
                  className="group/label w-full gap-2"
                >
                  <ChevronRightIcon className="transition-transform group-data-panel-open/label:rotate-90" />
                  {category.label}
                  <span className="ml-auto">{category.files.length}</span>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {category.files.map((file) => (
                        <SidebarMenuItem key={file}>
                          <SidebarMenuButton
                            isActive={selectedFile === file}
                            onClick={() => onSelectFile(file)}
                          >
                            <FileCodeIcon />
                            <span>{file}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
