import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppSidebar, type View } from "@/components/app-sidebar";
import { CodeEditor } from "@/components/code-editor";
import { FileIcon } from "@/components/file-icon";
import { ConsolePanel } from "@/components/console-panel";
import { GuestLogoutDialog } from "@/components/guest-logout-dialog";
import { DatabaseScreen } from "@/components/database-screen";
import { JobsScreen } from "@/components/jobs-screen";
import { PracticeScreen } from "@/components/practice-screen";
import { SaveStatus } from "@/components/save-status";
import { UnsyncedDialog } from "@/components/unsynced-dialog";
import { PlayIcon, SquareIcon, WandSparklesIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRunner } from "@/hooks/use-runner";
import { useSync } from "@/hooks/use-sync";
import { canFormat } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
import { allowClose, isCloseBlocked, setCloseGuarded } from "@/lib/close-guard";
import { exportGuestFiles, whenSavesSettled } from "@/lib/files";
import { useFilesQuery, useSyncStatusQuery } from "@/lib/queries";
import { unsyncedCount } from "@/lib/sync";
import logo from "@/assets/logo.png";

export function WorkspaceScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [view, setView] = useState<View>("Programs");
  // Practice and Jobs use the whole main area, so the sidebar's second column
  // stays hidden there, and comes back as it was when leaving.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fullScreen = view === "Practice" || view === "Jobs";
  const flushEditorRef = useRef<() => void>(() => {});
  const formatEditorRef = useRef<() => Promise<void>>(async () => {});
  const [formatting, setFormatting] = useState(false);
  // Logging out or closing, held back to warn that a guest's files go.
  const [guestAction, setGuestAction] = useState<"log out" | "close" | null>(null);
  // Logging out or closing, held back by unsynced changes.
  const [unsyncedAction, setUnsyncedAction] = useState<"log out" | "close" | null>(null);
  const runner = useRunner();
  const syncStatus = useSyncStatusQuery(session.id, !session.guest);
  const unsynced = unsyncedCount(syncStatus.data);
  const guestFiles = useFilesQuery(session.id).data?.length ?? 0;
  const sync = useSync({
    userId: session.id,
    selectedFile,
    onSelectFile: setSelectedFile,
    flushEdits: () => flushEditorRef.current(),
  });

  // Bring down the student's files from GitHub (e.g. on a new computer).
  // Until that's done, Programs can't tell "no programs" from "not here yet".
  const [pulled, setPulled] = useState(session.guest);
  const { pull } = sync;
  useEffect(() => {
    if (!session.guest) pull().then(() => setPulled(true));
  }, [session.guest, pull]);

  // Closing the window asks first if that would lose anything: unsynced
  // changes, or (since they're deleted) a guest's files.
  useEffect(() => {
    setCloseGuarded(session.guest ? guestFiles > 0 : unsynced > 0);
    return () => setCloseGuarded(false);
  }, [session.guest, guestFiles, unsynced]);
  useEffect(() => {
    const listening = getCurrentWindow().onCloseRequested((event) => {
      if (!isCloseBlocked()) return;
      event.preventDefault();
      if (session.guest) setGuestAction("close");
      else setUnsyncedAction("close");
    });
    return () => {
      listening.then((stop) => stop());
    };
  }, [session.guest]);

  function closeWindow() {
    allowClose();
    getCurrentWindow().close();
  }

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

  function handleViewChange(next: View) {
    setView(next);
    if (next !== "Practice" && next !== "Jobs") setSidebarOpen(true);
  }

  return (
    <SidebarProvider
      open={sidebarOpen && !fullScreen}
      onOpenChange={(open) => {
        if (!fullScreen) setSidebarOpen(open);
      }}
      className="h-svh"
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar
        session={session}
        onLogout={
          session.guest
            ? () => setGuestAction("log out")
            : unsynced > 0
              ? () => setUnsyncedAction("log out")
              : handleLogout
        }
        view={view}
        onViewChange={handleViewChange}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
        onFlushEdits={() => flushEditorRef.current()}
        pulling={!pulled}
        syncStatus={syncStatus.data}
        unsynced={unsynced}
        syncing={sync.syncing}
        onSync={sync.sync}
      />
      {/* min-w-0: let the main area shrink when the sidebar expands. Without it,
          Monaco's pixel width (set while collapsed) holds it wide and pushes
          the header, including Run, off screen. */}
      <SidebarInset className="min-h-0 min-w-0">
        {view === "Database" ? (
          <DatabaseScreen />
        ) : view === "Practice" ? (
          <PracticeScreen />
        ) : view === "Jobs" ? (
          // A guest logs in by logging out of the guest session.
          <JobsScreen guest={session.guest} onLogin={() => setGuestAction("log out")} />
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
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
                disabled={!selectedFile || !canFormat(selectedFile) || formatting || sync.syncing}
                onClick={handleFormat}
              >
                {formatting ? <Spinner /> : <WandSparklesIcon />}
                Format
              </Button>
              {runner.loading && !runner.loadingLong ? (
                // Until the console shows the output (see MIN_LOADING_MS).
                <Button disabled>
                  <Spinner />
                  Run
                </Button>
              ) : runner.running ? (
                <Button variant="destructive" onClick={runner.stop}>
                  {runner.loading ? <Spinner /> : <SquareIcon />}
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
                    readOnly={sync.syncing}
                    flushRef={flushEditorRef}
                    formatRef={formatEditorRef}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="30%" minSize="10%">
                  <ConsolePanel
                    entries={runner.entries}
                    loading={runner.loading}
                    running={runner.running}
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
          </>
        )}
      </SidebarInset>
      <UnsyncedDialog
        action={unsyncedAction}
        count={unsynced}
        syncing={sync.syncing}
        onCancel={() => setUnsyncedAction(null)}
        onProceed={() => {
          const action = unsyncedAction;
          setUnsyncedAction(null);
          if (action === "log out") handleLogout();
          else closeWindow();
        }}
        onSyncAndProceed={async () => {
          const action = unsyncedAction;
          // Stay put if the sync fails (its error shows), so nothing is lost.
          if (!(await sync.sync())) return;
          setUnsyncedAction(null);
          if (action === "log out") handleLogout();
          else closeWindow();
        }}
      />
      <GuestLogoutDialog
        action={guestAction}
        onCancel={() => setGuestAction(null)}
        onExport={async () => {
          // Include the last few keystrokes.
          flushEditorRef.current();
          await whenSavesSettled();
          return exportGuestFiles();
        }}
        onConfirm={() => {
          const action = guestAction;
          setGuestAction(null);
          if (action === "log out") handleLogout();
          else closeWindow();
        }}
      />
    </SidebarProvider>
  );
}
