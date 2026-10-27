import { useCallback, useLayoutEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { toast } from "sonner";
import {
  blockClipboard,
  EDITOR_FONT_SIZE,
  EDITOR_PADDING,
  editorModelPath,
  NO_CLIPBOARD_OPTIONS,
} from "@/lib/monaco";
import { useIsDark } from "@/hooks/use-theme";
import { monacoLanguageOf, whenSavesSettled } from "@/lib/files";
import { formatCode, NoFormatterError } from "@/lib/format";
import { useFileContentQuery, useSaveFileMutation } from "@/lib/queries";
import { createEditorSaveCoordinator } from "@/lib/save-queue";

/** How long to wait after the last keystroke before saving. */
export const AUTOSAVE_DELAY_MS = 500;

export type FlushRef = React.RefObject<() => Promise<void> | void>;
export type DiscardRef = React.RefObject<() => void>;
export type HasUnsavedRef = React.RefObject<() => boolean>;
export type FormatRef = React.RefObject<() => Promise<void>>;
export type CursorLineRef = React.RefObject<() => number | null>;

type MonacoEditor = Parameters<OnMount>[0];

export function CodeEditor({
  userId,
  filename,
  readOnly,
  flushRef,
  discardRef,
  hasUnsavedRef,
  onDirtyChange,
  formatRef,
  cursorLineRef,
}: {
  userId: string;
  filename: string;
  /** While syncing, so nothing typed is overwritten by GitHub's version. */
  readOnly: boolean;
  /** Set to a function that saves pending edits immediately (used before logout). */
  flushRef: FlushRef;
  /** Set to a function that discards pending edits without saving. */
  discardRef?: DiscardRef;
  /** Set to a function that returns whether the editor has unsaved edits. */
  hasUnsavedRef?: HasUnsavedRef;
  /** Called when the dirty/unsaved state changes. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Set to a function that formats the open file (used by the Format button). */
  formatRef: FormatRef;
  /** Set to a function that returns the cursor's line (used by Run line). */
  cursorLineRef: CursorLineRef;
}) {
  // Not keyed by file on purpose: like VS Code, one editor stays mounted and
  // switching files just swaps its model, so there's no reload.
  return (
    <FileEditor
      userId={userId}
      filename={filename}
      readOnly={readOnly}
      flushRef={flushRef}
      discardRef={discardRef}
      hasUnsavedRef={hasUnsavedRef}
      onDirtyChange={onDirtyChange}
      formatRef={formatRef}
      cursorLineRef={cursorLineRef}
    />
  );
}

function FileEditor({
  userId,
  filename,
  readOnly,
  flushRef,
  discardRef,
  hasUnsavedRef,
  onDirtyChange,
  formatRef,
  cursorLineRef,
}: {
  userId: string;
  filename: string;
  readOnly: boolean;
  flushRef: FlushRef;
  discardRef?: DiscardRef;
  hasUnsavedRef?: HasUnsavedRef;
  onDirtyChange?: (dirty: boolean) => void;
  formatRef: FormatRef;
  cursorLineRef: CursorLineRef;
}) {
  const isDark = useIsDark();
  const editorRef = useRef<MonacoEditor | null>(null);
  const content = useFileContentQuery(userId, filename);
  const { mutateAsync: saveAsync } = useSaveFileMutation(userId);

  const saveAsyncRef = useRef(saveAsync);
  useLayoutEffect(() => {
    saveAsyncRef.current = saveAsync;
  });

  const coordinator = useRef<ReturnType<typeof createEditorSaveCoordinator> | null>(null);
  if (!coordinator.current) {
    coordinator.current = createEditorSaveCoordinator((edit) => saveAsyncRef.current(edit));
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onDirtyChangeRef = useRef(onDirtyChange);
  useLayoutEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  const notifyDirty = useCallback(() => {
    const dirty = coordinator.current?.hasUnsaved() ?? false;
    onDirtyChangeRef.current?.(dirty);
  }, []);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!coordinator.current) return;
    try {
      await coordinator.current.flush();
      await whenSavesSettled();
    } finally {
      notifyDirty();
    }
  }, [notifyDirty]);

  const isDiscarded = useRef(false);

  const discard = useCallback(() => {
    clearTimeout(timer.current);
    isDiscarded.current = true;
    coordinator.current?.discard();
    notifyDirty();
  }, [notifyDirty]);

  useLayoutEffect(() => {
    isDiscarded.current = false;
  }, [filename]);

  useLayoutEffect(() => {
    if (discardRef) {
      discardRef.current = discard;
      return () => {
        discardRef.current = () => {};
      };
    }
  }, [discard, discardRef]);

  useLayoutEffect(() => {
    if (hasUnsavedRef) {
      hasUnsavedRef.current = () => coordinator.current?.hasUnsaved() ?? false;
      return () => {
        hasUnsavedRef.current = () => false;
      };
    }
  }, [hasUnsavedRef]);

  useLayoutEffect(() => {
    return () => {
      onDirtyChangeRef.current?.(false);
    };
  }, []);

  // Layout effects so the cleanups run synchronously: the previous file's edits
  // are saved on switch, and everything is saved when the editor unmounts.
  useLayoutEffect(() => {
    flushRef.current = flush;
    return () => {
      if (!isDiscarded.current) {
        void flush().catch(() => {});
      }
      flushRef.current = () => {};
    };
  }, [flush, flushRef]);

  useLayoutEffect(
    () => () => {
      if (!isDiscarded.current && coordinator.current) {
        void coordinator.current
          .flushFile(filename)
          .catch(() => {})
          .finally(notifyDirty);
      }
    },
    [filename, notifyDirty],
  );

  // Replaces the text with the formatted version as one edit, so a single
  // Ctrl/Cmd+Z undoes it. The change then autosaves like any other edit.
  const format = useCallback(async () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    // Read-only while syncing; the shortcut would otherwise still edit.
    if (!editor || !model || editor.getRawOptions().readOnly) return;
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

  useLayoutEffect(() => {
    cursorLineRef.current = () => editorRef.current?.getPosition()?.lineNumber ?? null;
    return () => {
      cursorLineRef.current = () => null;
    };
  }, [cursorLineRef]);

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
        blockClipboard(editor);
        // Shift+Alt+F, the same shortcut as VS Code's Format Document.
        editor.addAction({
          id: "prepcode.format",
          label: "Format Code",
          keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
          run: () => formatRef.current(),
        });
      }}
      onChange={(value) => {
        isDiscarded.current = false;
        coordinator.current?.recordEdit(filename, value ?? "");
        notifyDirty();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush().catch(() => {}), AUTOSAVE_DELAY_MS);
      }}
      options={{
        ...NO_CLIPBOARD_OPTIONS,
        fontSize: EDITOR_FONT_SIZE,
        padding: EDITOR_PADDING,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        readOnly,
        readOnlyMessage: { value: "Syncing with GitHub… you can type again in a moment." },
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
