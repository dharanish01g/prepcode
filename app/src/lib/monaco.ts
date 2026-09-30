// Bundle Monaco with the app instead of letting @monaco-editor/react fetch it
// from a CDN, so the editor works on offline lab machines.
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import { onZoomApplied } from "@/hooks/use-zoom";

self.MonacoEnvironment = {
  // Monaco 0.57+ bundles its language workers (TypeScript, JSON, ...) itself via
  // `new URL(..., import.meta.url)`, but not the base editor worker. Returning
  // undefined for other labels falls back to Monaco's own loading.
  getWorker(_workerId, label) {
    if (label === "editorWorkerService") return new EditorWorker();
    return undefined as unknown as Worker;
  },
};

loader.config({ monaco });

// Monaco caches character widths; re-measure after zooming so the cursor and
// selections stay aligned with the text.
onZoomApplied(() => monaco.editor.remeasureFonts());

/** Frees every open file's text, cursor and undo history (on logout). */
export function disposeEditorModels() {
  for (const model of monaco.editor.getModels()) model.dispose();
}

/** The editor model path for a student's file, e.g. "21CS001/hello.py". */
export function editorModelPath(regNo: string, filename: string) {
  return `${regNo}/${filename}`;
}

/**
 * Frees one file's editor model. Needed after a rename or delete: the editor
 * reuses a model by path, so a new file with the old name would otherwise
 * show the old text. Call it once no editor is showing the file.
 */
export function disposeEditorModel(path: string) {
  monaco.editor.getModel(monaco.Uri.parse(path))?.dispose();
}
