import { useCallback, useLayoutEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { toast } from "sonner";
import { editorModelPath } from "@/lib/monaco";
import { useIsDark } from "@/hooks/use-theme";
import { monacoLanguageOf } from "@/lib/files";
import { formatCode, NoFormatterError } from "@/lib/format";
import { useFileContentQuery, useSaveFileMutation } from "@/lib/queries";

/** How long to wait after the last keystroke before saving. */
const AUTOSAVE_DELAY_MS = 500;

export type FlushRef = React.RefObject<() => void>;
export type FormatRef = React.RefObject<() => Promise<void>>;

type MonacoEditor = Parameters<OnMount>[0];

export function CodeEditor({
  userId,
  filename,
  flushRef,
  formatRef,
}: {
  userId: string;
  filename: string;
  /** Set to a function that saves pending edits immediately (used before logout). */
  flushRef: FlushRef;
  /** Set to a function that formats the open file (used by the Format button). */
  formatRef: FormatRef;
}) {
  // Not keyed by file on purpose: like VS Code, one editor stays mounted and
  // switching files just swaps its model, so there's no reload.
  return (
    <FileEditor userId={userId} filename={filename} flushRef={flushRef} formatRef={formatRef} />
  );
}

function FileEditor({
  userId,
  filename,
  flushRef,
  formatRef,
}: {
  userId: string;
  filename: string;
  flushRef: FlushRef;
  formatRef: FormatRef;
}) {
  const isDark = useIsDark();
  const editorRef = useRef<MonacoEditor | null>(null);
  const content = useFileContentQuery(userId, filename);
  const { mutate: save } = useSaveFileMutation(userId);

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

  // Replaces the text with the formatted version as one edit, so a single
  // Ctrl/Cmd+Z undoes it. The change then autosaves like any other edit.
  const format = useCallback(async () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    const source = model.getValue();

    let formatted: string;
    try {
      formatted = await formatCode(filename, source);
    } catch (err) {
      console.error("Format failed:", err);
      toast.error(`Couldn't format ${filename}`, {
        description:
          err instanceof NoFormatterError
            ? "Formatting isn't available for this language yet."
            : "Fix the errors in your code first, then try again.",
      });
      return;
    }
    // Skip if nothing changed, or the student switched files or kept typing meanwhile.
    if (formatted === source || editor.getModel() !== model || model.getValue() !== source) {
      return;
    }

    const position = editor.getPosition();
    editor.pushUndoStop();
    editor.executeEdits("format", [{ range: model.getFullModelRange(), text: formatted }]);
    editor.pushUndoStop();
    if (position) editor.setPosition(model.validatePosition(position));
    editor.focus();
  }, [filename]);

  useLayoutEffect(() => {
    formatRef.current = format;
    return () => {
      formatRef.current = async () => {};
    };
  }, [format, formatRef]);

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
      // cursor, undo history) while switching; they're disposed on logout, and
      // one at a time when its file is renamed or deleted.
      path={editorModelPath(userId, filename)}
      defaultValue={content.data}
      language={monacoLanguageOf(filename)}
      theme={isDark ? "vs-dark" : "light"}
      keepCurrentModel
      loading={null}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        // Shift+Alt+F, the same shortcut as VS Code's Format Document.
        editor.addAction({
          id: "prepcode.format",
          label: "Format Code",
          keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
          run: () => formatRef.current(),
        });
      }}
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
