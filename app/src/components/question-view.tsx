import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import { usePanelRef } from "react-resizable-panels";
import { Maximize2Icon, Minimize2Icon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { CheckResults, passedCount, type CheckState } from "@/components/check-results";
import { AUTOSAVE_DELAY_MS, type FlushRef } from "@/components/code-editor";
import { Markdown } from "@/components/markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsDark } from "@/hooks/use-theme";
import { readPractice, writePractice } from "@/lib/files";
import type { Language } from "@/lib/languages";
import {
  blockClipboard,
  EDITOR_FONT_SIZE,
  EDITOR_PADDING,
  editorModelPath,
  NO_CLIPBOARD_OPTIONS,
} from "@/lib/monaco";
import type { Question } from "@/lib/questions";
import { starterCode } from "@/lib/drivers";
import { cn } from "@/lib/utils";

type MonacoEditor = Parameters<OnMount>[0];

/** Set to a function that saves the code as it is now and returns it (null if none). */
export type CodeRef = React.RefObject<() => string | null>;

/** The question's share of the width, beside the code. */
function questionSize(sidebarOpen: boolean) {
  return sidebarOpen ? "50%" : "40%";
}

/**
 * A question being solved: the question on the left, the code on the right,
 * with Run's and Submit's results below. Full screen collapses the question
 * and the results, leaving just the code.
 */
export function QuestionView({
  userId,
  question,
  language,
  flushRef,
  codeRef,
  check,
  languagePicker,
}: {
  userId: string;
  question: Question;
  /** The picked language; null until one is installed. */
  language: Language | null;
  /** Set to a function that saves pending edits (used before logout). */
  flushRef: FlushRef;
  /** Used by Run and Submit. */
  codeRef: CodeRef;
  /** The last Run or Submit for this question and language. */
  check: CheckState | undefined;
  /** Shown in the bar above the editor: the language the code is in. */
  languagePicker: React.ReactNode;
}) {
  const { open: sidebarOpen } = useSidebar();
  const questionPanel = usePanelRef();
  const resultsPanel = usePanelRef();
  const resetRef = useRef<() => void>(() => {});
  const [resetOpen, setResetOpen] = useState(false);
  // Both panels collapsed, by the button or by dragging them shut.
  const [fullScreen, setFullScreen] = useState(false);
  const updateFullScreen = useCallback(() => {
    setFullScreen(
      Boolean(questionPanel.current?.isCollapsed() && resultsPanel.current?.isCollapsed()),
    );
  }, [questionPanel, resultsPanel]);

  // With the sidebar's list closed, the code gets the extra room. Not while
  // the question is collapsed: resizing would bring it back.
  useEffect(() => {
    if (questionPanel.current?.isCollapsed()) return;
    questionPanel.current?.resize(questionSize(sidebarOpen));
  }, [sidebarOpen, questionPanel]);

  const count = passedCount(check);

  // Run and Submit show their results, even in full screen.
  const checking = check?.status === "checking";
  useEffect(() => {
    if (checking) resultsPanel.current?.expand();
  }, [checking, resultsPanel]);

  function toggleFullScreen() {
    for (const panel of [questionPanel, resultsPanel]) {
      if (fullScreen) panel.current?.expand();
      else panel.current?.collapse();
    }
  }

  return (
    <>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel
          id="question"
          panelRef={questionPanel}
          defaultSize={questionSize(sidebarOpen)}
          minSize="25%"
          collapsible
          collapsedSize="0%"
          onResize={updateFullScreen}
        >
          {/* The explanation (question.explanation) is hidden for now. */}
          <ScrollArea className="h-full">
            <div className="p-4">
              <h1 className="mb-3 text-base font-semibold">{question.title}</h1>
              <Markdown>{question.description}</Markdown>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel id="code" minSize="30%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel id="editor" defaultSize="65%" minSize="20%">
              <div className="flex h-full flex-col">
                {/* The editor's bar: its language, Reset and full screen. */}
                <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
                  {languagePicker}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    disabled={!language}
                    onClick={() => setResetOpen(true)}
                  >
                    <RotateCcwIcon />
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleFullScreen}
                    aria-label={fullScreen ? "Exit full screen" : "Full screen"}
                    title={fullScreen ? "Exit full screen" : "Full screen"}
                  >
                    {fullScreen ? <Minimize2Icon /> : <Maximize2Icon />}
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  {language ? (
                    <PracticeEditor
                      // Remounted per language, so each loads its own saved code.
                      key={language.extension}
                      userId={userId}
                      question={question.slug}
                      language={language}
                      starter={
                        question.signature
                          ? starterCode(question.signature, language.extension)
                          : "// This question isn't ready to solve yet.\n"
                      }
                      flushRef={flushRef}
                      codeRef={codeRef}
                      resetRef={resetRef}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                      Download a language from the list above to start.
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="output"
              panelRef={resultsPanel}
              defaultSize="35%"
              minSize="10%"
              collapsible
              collapsedSize="0%"
              onResize={updateFullScreen}
            >
              <div className="flex h-full flex-col">
                <div className="flex h-9 shrink-0 items-center border-b px-4 text-xs font-medium">
                  Results
                  {count && (
                    <span
                      className={cn(
                        "ml-auto tabular-nums",
                        count.passed === count.total
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      {count.passed}/{count.total} passed
                    </span>
                  )}
                </div>
                <div className="min-h-0 flex-1">
                  <CheckResults state={check} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <RotateCcwIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Reset your code?</AlertDialogTitle>
            <AlertDialogDescription>
              Your {language?.name} code for this question goes back to the starter code. To get it
              back, undo in the editor with Ctrl+Z (⌘Z on a Mac).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetRef.current();
                setResetOpen(false);
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * The student's code for a question in one language. Opens what they saved
 * last, or the starter code, and saves as they type.
 */
function PracticeEditor({
  userId,
  question,
  language,
  starter,
  flushRef,
  codeRef,
  resetRef,
}: {
  userId: string;
  question: string;
  language: Language;
  /** The code to start from, before anything is saved. */
  starter: string;
  flushRef: FlushRef;
  codeRef: CodeRef;
  /** Set to a function that puts the starter code back. */
  resetRef: FlushRef;
}) {
  const isDark = useIsDark();
  const editorRef = useRef<MonacoEditor | null>(null);
  const { extension } = language;
  const saved = useQuery({
    queryKey: ["practice", userId, question, extension],
    queryFn: () => readPractice(question, extension),
  });

  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const content = pending.current;
    if (content === null) return;
    pending.current = null;
    writePractice(question, extension, content).catch((err) =>
      toast.error("Couldn't save your code", { description: String(err) }),
    );
  }, [question, extension]);

  // Layout effects so the cleanups run synchronously: edits are saved when the
  // question or language changes, and when the editor unmounts.
  useLayoutEffect(() => {
    flushRef.current = flush;
    // One edit, so Ctrl/Cmd+Z brings the code back. It autosaves like any other.
    resetRef.current = () => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model) return;
      editor.pushUndoStop();
      editor.executeEdits("reset", [{ range: model.getFullModelRange(), text: starter }]);
      editor.pushUndoStop();
      editor.setPosition({ lineNumber: 1, column: 1 });
      editor.focus();
    };
    codeRef.current = () => {
      // Saved even if untouched, so the starter code is kept too.
      const content = editorRef.current?.getValue();
      if (content === undefined) return null;
      pending.current = content;
      flush();
      return content;
    };
    return () => {
      flush();
      flushRef.current = () => {};
      codeRef.current = () => null;
      resetRef.current = () => {};
    };
  }, [flush, flushRef, codeRef, resetRef, starter]);

  if (saved.isError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-destructive">
        {String(saved.error)}
      </div>
    );
  }
  if (saved.isPending) return null;

  return (
    <Editor
      // One model per question and language, scoped by student, so switching
      // either keeps what was typed (and its undo history) until logout.
      path={editorModelPath(userId, `practice/${question}.${extension}`)}
      defaultValue={saved.data ?? starter}
      language={language.monaco}
      keepCurrentModel
      theme={isDark ? "vs-dark" : "light"}
      loading={null}
      onMount={(editor) => {
        editorRef.current = editor;
        blockClipboard(editor);
      }}
      onChange={(value) => {
        pending.current = value ?? "";
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
      }}
      options={{
        ...NO_CLIPBOARD_OPTIONS,
        fontSize: EDITOR_FONT_SIZE,
        padding: EDITOR_PADDING,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  );
}
