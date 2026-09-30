import { useCallback, useLayoutEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import "@/lib/monaco";
import { useIsDark } from "@/hooks/use-theme";
import { monacoLanguageOf } from "@/lib/files";
import { useFileContentQuery, useSaveFileMutation } from "@/lib/queries";

/** How long to wait after the last keystroke before saving. */
const AUTOSAVE_DELAY_MS = 500;

export type FlushRef = React.RefObject<() => void>;

export function CodeEditor({
  regNo,
  filename,
  flushRef,
}: {
  regNo: string;
  filename: string;
  /** Set to a function that saves pending edits immediately (used before logout). */
  flushRef: FlushRef;
}) {
  // Not keyed by file on purpose: like VS Code, one editor stays mounted and
  // switching files just swaps its model, so there's no reload.
  return <FileEditor regNo={regNo} filename={filename} flushRef={flushRef} />;
}

function FileEditor({
  regNo,
  filename,
  flushRef,
}: {
  regNo: string;
  filename: string;
  flushRef: FlushRef;
}) {
  const isDark = useIsDark();
  const content = useFileContentQuery(regNo, filename);
  const { mutate: save } = useSaveFileMutation(regNo);

  // Remembers which file the unsaved text belongs to, so a flush after
  // switching files still saves to the right place.
  const pending = useRef<{ filename: string; content: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const edit = pending.current;
    if (!edit) return;
    pending.current = null;
    save(edit);
  }, [save]);

  // Layout effects so the cleanups run synchronously: the previous file's edits
  // are saved on switch, and everything is saved when the editor unmounts.
  useLayoutEffect(() => {
    flushRef.current = flush;
    return () => {
      flush();
      flushRef.current = () => {};
    };
  }, [flush, flushRef]);

  useLayoutEffect(() => () => flush(), [filename, flush]);

  if (content.isError) {
    return <EditorMessage>{String(content.error)}</EditorMessage>;
  }
  // Contents are prefetched when the file list loads, so this is rarely hit.
  if (content.isPending) {
    return null;
  }

  return (
    <Editor
      // One model per file, scoped by student. Monaco keeps each model (text,
      // cursor, undo history) while switching; they're disposed on logout.
      path={`${regNo}/${filename}`}
      defaultValue={content.data}
      language={monacoLanguageOf(filename)}
      theme={isDark ? "vs-dark" : "light"}
      keepCurrentModel
      loading={null}
      onChange={(value) => {
        pending.current = { filename, content: value ?? "" };
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
      }}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  );
}

function EditorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
