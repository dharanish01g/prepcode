import { useRef, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CodeEditor } from "@/components/code-editor";
import { ConsolePanel } from "@/components/console-panel";
import { SaveStatus } from "@/components/save-status";
import { PlayIcon, SquareIcon } from "lucide-react";
import { useRunner } from "@/hooks/use-runner";
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
  const runner = useRunner();

  // Save the last few keystrokes before the backend forgets who's logged in.
  async function handleLogout() {
    if (runner.running) runner.stop();
    flushEditorRef.current();
    await whenSavesSettled();
    onLogout();
  }

  // Always run what's on screen: save pending edits first.
  async function handleRun() {
    if (!selectedFile) return;
    flushEditorRef.current();
    await whenSavesSettled();
    runner.run(selectedFile);
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
      {/* min-w-0: let the main area shrink when the sidebar expands. Without it,
          Monaco's pixel width (set while collapsed) holds it wide and pushes
          the header, including Run, off screen. */}
      <SidebarInset className="min-h-0 min-w-0">
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
          <div className="ml-auto">
            <SaveStatus />
          </div>
          {runner.running ? (
            <Button variant="destructive" onClick={runner.stop}>
              <SquareIcon />
              Stop
            </Button>
          ) : (
            <Button disabled={!selectedFile} onClick={handleRun}>
              <PlayIcon />
              Run
            </Button>
          )}
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
            <ConsolePanel
              entries={runner.entries}
              acceptingInput={runner.acceptingInput}
              onSend={runner.send}
              onClear={runner.clear}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
