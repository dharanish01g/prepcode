import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AppUpdater } from "@/components/app-updater";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <AppUpdater />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);
