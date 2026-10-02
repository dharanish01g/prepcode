import { useRef, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CodeEditor } from "@/components/code-editor";
import { FileIcon } from "@/components/file-icon";
import { ConsolePanel } from "@/components/console-panel";
import { GuestLogoutDialog } from "@/components/guest-logout-dialog";
import { SaveStatus } from "@/components/save-status";
import { PlayIcon, SquareIcon, WandSparklesIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRunner } from "@/hooks/use-runner";
import { canFormat } from "@/lib/format";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { displayName, type Session } from "@/lib/auth";
import { exportGuestFiles, whenSavesSettled } from "@/lib/files";
import logo from "@/assets/logo.png";

export function WorkspaceScreen({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const flushEditorRef = useRef<() => void>(() => {});
  const formatEditorRef = useRef<() => Promise<void>>(async () => {});
  const [formatting, setFormatting] = useState(false);
  const [confirmGuestLogout, setConfirmGuestLogout] = useState(false);
  const runner = useRunner();

  // Save the last few keystrokes before the backend forgets who's logged in.
  async function handleLogout() {
    if (runner.running) runner.stop();
    flushEditorRef.current();
    await whenSavesSettled();
    onLogout();
  }

  // The first format of each language loads its formatter, so show progress.
  async function handleFormat() {
    setFormatting(true);
    try {
      await formatEditorRef.current();
    } finally {
      setFormatting(false);
    }
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
        onLogout={session.guest ? () => setConfirmGuestLogout(true) : handleLogout}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
        onFlushEdits={() => flushEditorRef.current()}
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
                {selectedFile ? (
                  displayName(session)
                ) : (
                  <BreadcrumbPage>{displayName(session)}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {selectedFile && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-1.5">
                      <FileIcon filename={selectedFile} />
                      {selectedFile}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <SaveStatus />
          </div>
          <Button
            variant="outline"
            disabled={!selectedFile || !canFormat(selectedFile) || formatting}
            onClick={handleFormat}
          >
            {formatting ? <Spinner /> : <WandSparklesIcon />}
            Format
          </Button>
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

        {selectedFile ? (
          <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
            <ResizablePanel defaultSize="70%" minSize="20%">
              <CodeEditor
                userId={session.id}
                filename={selectedFile}
                flushRef={flushEditorRef}
                formatRef={formatEditorRef}
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
        ) : (
          // Like VS Code's watermark: nothing to edit or run until a file is open.
          // pb-24 lifts it above true center, offsetting the header bar above.
          <Empty className="pb-24">
            <EmptyHeader className="gap-1">
              {/* -mb-4 trims the transparent padding at the bottom of logo.png. */}
              <EmptyMedia className="mb-0">
                <img src={logo} alt="" className="-mb-4 size-32 opacity-40 grayscale" />
              </EmptyMedia>
              <EmptyTitle className="text-3xl font-semibold text-muted-foreground">
                prepcode
              </EmptyTitle>
              <EmptyDescription className="text-sm">
                Create or select a file to start coding.
                {session.guest && (
                  <>
                    <br />
                    You're a guest: your files are deleted when you log out or close prepcode.
                  </>
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SidebarInset>
      <GuestLogoutDialog
        open={confirmGuestLogout}
        onCancel={() => setConfirmGuestLogout(false)}
        onExport={async () => {
          // Include the last few keystrokes.
          flushEditorRef.current();
          await whenSavesSettled();
          return exportGuestFiles();
        }}
        onConfirm={() => {
          setConfirmGuestLogout(false);
          handleLogout();
        }}
      />
    </SidebarProvider>
  );
}
