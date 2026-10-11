import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AppUpdater } from "@/components/app-updater";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { initZoom } from "@/hooks/use-zoom";
import { loadLanguages } from "@/lib/languages";
import { queryClient } from "@/lib/query-client";
import { startLogging } from "@/lib/reporting";

startLogging();
initZoom();

// Hide the webview's own right-click menu (Reload, Inspect, ...) everywhere.
// Our own menus, like the one on files, still open: they handle the click first.
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Block accidental page reload (Ctrl/Cmd+R, Ctrl/Cmd+Shift+R, F5) which resets app state / logs out.
// Block DevTools shortcuts (Ctrl/Cmd+Shift+I/J/C, F12).
// Block manual suggestion trigger (Ctrl/Cmd+Space).
window.addEventListener(
  "keydown",
  (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Refresh: Ctrl+R, Ctrl+Shift+R, F5, Ctrl+F5
    if ((isCtrlOrCmd && (e.key === "r" || e.key === "R")) || e.key === "F5") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // DevTools: Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12
    if (
      (isCtrlOrCmd && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
      e.key === "F12"
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Suggestions shortcut: Ctrl+Space / Cmd+Space
    if (isCtrlOrCmd && (e.code === "Space" || e.key === " " || e.keyCode === 32)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  },
  true,
);

// Languages are used everywhere (icons, editor, new-file dialog), so load the
// catalog before the first render. It's a local database read, so it's quick.
loadLanguages()
  .catch((error) => console.error("Could not load languages:", error))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <AppUpdater />
          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </React.StrictMode>,
    );
  });
