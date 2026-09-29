import { useRef, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CodeEditor } from "@/components/code-editor";
import { ConsolePanel } from "@/components/console-panel";
import { SaveStatus } from "@/components/save-status";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Session } from "@/lib/auth";
import { whenSavesSettled } from "@/lib/files";

export function WorkspaceScreen({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const flushEditorRef = useRef<() => void>(() => {});

  // Save the last few keystrokes before the backend forgets who's logged in.
  async function handleLogout() {
    flushEditorRef.current();
    await whenSavesSettled();
    onLogout();
  }

  return (
    <SidebarProvider
      className="h-svh"
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar
        session={session}
        onLogout={handleLogout}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
      />
      <SidebarInset className="min-h-0">
        <header className="flex shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {selectedFile ? session.reg_no : <BreadcrumbPage>{session.reg_no}</BreadcrumbPage>}
              </BreadcrumbItem>
              {selectedFile && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedFile}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {/* Running programs isn't built yet; the button is wired up next. */}
          <div className="ml-auto">
            <SaveStatus />
          </div>
          <Button disabled={!selectedFile}>
            <PlayIcon />
            Run
          </Button>
        </header>

        <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="70%" minSize="20%">
            <CodeEditor
              regNo={session.reg_no}
              filename={selectedFile}
              flushRef={flushEditorRef}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="30%" minSize="10%">
            <ConsolePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
