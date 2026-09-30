import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AppUpdater } from "@/components/app-updater";
import { Toaster } from "@/components/ui/sonner";
import { initZoom } from "@/hooks/use-zoom";
import { loadLanguages } from "@/lib/languages";
import { queryClient } from "@/lib/query-client";

initZoom();

// Languages are used everywhere (icons, editor, new-file dialog), so load the
// catalog before the first render. It's a local database read, so it's quick.
loadLanguages()
  .catch((error) => console.error("Could not load languages:", error))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
          <AppUpdater />
          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </React.StrictMode>,
    );
  });
