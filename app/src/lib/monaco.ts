// Bundle Monaco with the app instead of letting @monaco-editor/react fetch it
// from a CDN, so the editor works on offline lab machines.
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/languages/features/typescript/ts.worker?worker";
import { onZoomApplied } from "@/hooks/use-zoom";
import { registerCSharpCompletions } from "@/lib/csharp-completions";
import { registerPythonCompletions } from "@/lib/python-completions";

self.MonacoEnvironment = {
  // Once getWorker is set, Monaco asks it for every worker and never falls
  // back to its own loading, so each one the catalog's languages use must be
  // here. JavaScript's (errors and suggestions) is the only language worker;
  // the others are highlighting only.
  getWorker(_workerId, label) {
    if (label === "editorWorkerService") return new EditorWorker();
    if (label === "javascript" || label === "typescript") return new TypeScriptWorker();
    throw new Error(`No Monaco worker for ${label}: add it to MonacoEnvironment in monaco.ts`);
  },
};

loader.config({ monaco });
registerCSharpCompletions(monaco);
registerPythonCompletions(monaco);

/** Code text size in both editors. */
export const EDITOR_FONT_SIZE = 13;

/** Space above the first line and below the last, so code doesn't touch the borders. */
export const EDITOR_PADDING = { top: 10, bottom: 10 };

// Monaco caches character widths; re-measure after zooming so the cursor and
// selections stay aligned with the text.
onZoomApplied(() => monaco.editor.remeasureFonts());

/**
 * Editor options that keep students from copying or pasting code: no
 * right-click menu, no dragging text around, and no Linux middle-click paste.
 */
export const NO_CLIPBOARD_OPTIONS = {
  contextmenu: false,
  dragAndDrop: false,
  selectionClipboard: false,
} satisfies monaco.editor.IStandaloneEditorConstructionOptions;

// Typing and IME composition still go through; only these are blocked.
const CLIPBOARD_INPUT_TYPES = new Set([
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertFromDrop",
  "insertFromYank",
  "deleteByCut",
  "deleteByDrag",
]);

/**
 * Turns off copy, cut, paste and right-click inside an editor, on every OS.
 * Pair with NO_CLIPBOARD_OPTIONS.
 */
export function blockClipboard(editor: monaco.editor.IStandaloneCodeEditor) {
  const { KeyMod, KeyCode } = monaco;
  // CtrlCmd is Cmd on macOS and Ctrl on Windows and Linux. The Insert/Delete
  // shortcuts are the older Windows and Linux ones.
  for (const keybinding of [
    KeyMod.CtrlCmd | KeyCode.KeyC,
    KeyMod.CtrlCmd | KeyCode.KeyX,
    KeyMod.CtrlCmd | KeyCode.KeyV,
    KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyV,
    KeyMod.CtrlCmd | KeyCode.Insert,
    KeyMod.Shift | KeyCode.Insert,
    KeyMod.Shift | KeyCode.Delete,
  ]) {
    editor.addCommand(keybinding, () => {});
  }

  // Shortcuts aren't the only way in: the macOS Edit menu, the webview's own
  // right-click menu and dropping text from elsewhere all arrive as these
  // events, so stop them before Monaco sees them.
  const node = editor.getDomNode();
  if (!node) return;
  const block = (e: Event) => {
    if (e instanceof InputEvent && !CLIPBOARD_INPUT_TYPES.has(e.inputType)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  for (const type of ["copy", "cut", "paste", "contextmenu", "dragover", "drop", "beforeinput"]) {
    node.addEventListener(type, block, true);
  }
}

/** Frees every open file's text, cursor and undo history (on logout). */
export function disposeEditorModels() {
  for (const model of monaco.editor.getModels()) model.dispose();
}

/** The editor model path for a file, e.g. "gh-12345678/hello.py". */
export function editorModelPath(userId: string, filename: string) {
  return `${userId}/${filename}`;
}

/**
 * Frees one file's editor model. Needed after a rename or delete: the editor
 * reuses a model by path, so a new file with the old name would otherwise
 * show the old text. Call it once no editor is showing the file.
 */
export function disposeEditorModel(path: string) {
  monaco.editor.getModel(monaco.Uri.parse(path))?.dispose();
}

/**
 * Replaces an open file's text (after Sync brought a new version from
 * GitHub). Files that aren't open load the new text when opened.
 */
export function setEditorModelText(path: string, text: string) {
  const model = monaco.editor.getModel(monaco.Uri.parse(path));
  if (model && model.getValue() !== text) model.setValue(text);
}
