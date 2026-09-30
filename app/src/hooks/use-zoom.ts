import { useSyncExternalStore } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

/** Zoom steps, like VS Code's. The big ones are for projectors. */
const ZOOM_LEVELS = [0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const DEFAULT_ZOOM = 1;
const STORAGE_KEY = "zoom";

function getStoredZoom() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return ZOOM_LEVELS.includes(value) ? value : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM;
  }
}

// Shared by every component (sidebar menu, header badge) and the shortcuts.
let zoom = getStoredZoom();
const listeners = new Set<() => void>();
const appliedListeners = new Set<() => void>();

function applyZoom(next: number) {
  getCurrentWebview()
    .setZoom(next)
    // Wait a frame so the new layout exists before anyone measures it.
    .then(() => requestAnimationFrame(() => appliedListeners.forEach((notify) => notify())))
    .catch((err) => console.error("Zoom failed:", err));
}

function setZoom(next: number) {
  if (next === zoom) return;
  zoom = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Storage unavailable; zoom still applies for this session.
  }
  applyZoom(next);
  listeners.forEach((notify) => notify());
}

export function zoomIn() {
  setZoom(ZOOM_LEVELS.find((level) => level > zoom) ?? zoom);
}

export function zoomOut() {
  setZoom([...ZOOM_LEVELS].reverse().find((level) => level < zoom) ?? zoom);
}

export function resetZoom() {
  setZoom(DEFAULT_ZOOM);
}

/** Runs `callback` after each zoom change has been applied to the page. */
export function onZoomApplied(callback: () => void) {
  appliedListeners.add(callback);
  return () => appliedListeners.delete(callback);
}

const isMac = navigator.userAgent.includes("Mac");

function handleKeyDown(e: KeyboardEvent) {
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (!mod || e.altKey) return;

  let action: (() => void) | undefined;
  if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") action = zoomIn;
  else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") action = zoomOut;
  else if (e.key === "0" || e.code === "Numpad0") action = resetZoom;
  if (!action) return;

  // Capture phase, so this wins even while the code editor has focus.
  e.preventDefault();
  e.stopPropagation();
  action();
}

/** Applies the saved zoom and enables Ctrl/Cmd + =, - and 0. Call once at startup. */
export function initZoom() {
  if (zoom !== DEFAULT_ZOOM) applyZoom(zoom);
  window.addEventListener("keydown", handleKeyDown, { capture: true });
}

/** Current zoom, where 1 is 100%. */
export function useZoom() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => zoom,
  );
}

export function canZoomIn(level: number) {
  return level < ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
}

export function canZoomOut(level: number) {
  return level > ZOOM_LEVELS[0];
}

/** e.g. 1.25 -> "125%". */
export function zoomLabel(level: number) {
  return `${Math.round(level * 100)}%`;
}

/** Shortcut hints for the menu, e.g. "⌘+" on macOS, "Ctrl++" elsewhere. */
export const ZOOM_SHORTCUTS = isMac
  ? { in: "⌘+", out: "⌘−", reset: "⌘0" }
  : { in: "Ctrl++", out: "Ctrl+−", reset: "Ctrl+0" };
