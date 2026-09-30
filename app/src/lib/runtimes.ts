import { useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Extension } from "@/lib/files";

/** Languages that share one download. Keep in sync with LANGUAGE_RUNTIMES in runtimes.rs. */
const RUNTIME_OF: Record<Extension, string> = {
  py: "python",
  js: "node",
  c: "zig",
  cpp: "zig",
  java: "java",
};

export function sameRuntime(a: Extension, b: Extension) {
  return RUNTIME_OF[a] === RUNTIME_OF[b];
}

const RUNTIMES_KEY = ["runtimes"] as const;
const INSTALL_RUNTIME_KEY = ["install-runtime"] as const;

/** Languages whose runtime is installed on this computer. */
export function useInstalledRuntimes() {
  return useQuery({
    queryKey: RUNTIMES_KEY,
    queryFn: () => invoke<Extension[]>("list_runtimes"),
  });
}

export function useInstallRuntimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: INSTALL_RUNTIME_KEY,
    mutationFn: (extension: Extension) => invoke<void>("install_runtime", { extension }),
    onSettled: (_data, _error, extension) => {
      clearProgress(extension);
      return queryClient.invalidateQueries({ queryKey: RUNTIMES_KEY });
    },
  });
}

/** Languages currently downloading, from any component. */
export function useInstallingRuntimes() {
  return useMutationState({
    filters: { mutationKey: INSTALL_RUNTIME_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables as Extension,
  });
}

// --- Progress events from install_runtime --------------------------------

export type RuntimeProgress = {
  extension: Extension;
  stage: "downloading" | "unpacking" | "verifying";
  downloaded: number;
  total: number;
};

let progress: Partial<Record<Extension, RuntimeProgress>> = {};
const listeners = new Set<() => void>();

function setProgress(next: typeof progress) {
  progress = next;
  listeners.forEach((notify) => notify());
}

function clearProgress(extension: Extension) {
  const { [extension]: _removed, ...rest } = progress;
  setProgress(rest);
}

// Registered once for the app's lifetime; installs keep running across dialogs.
listen<RuntimeProgress>("runtime-progress", (event) => {
  setProgress({ ...progress, [event.payload.extension]: event.payload });
});

/** Latest progress for a language's download, or undefined when idle. */
export function useRuntimeProgress(extension: Extension) {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => progress[extension],
  );
}

/** Short status for a download in progress, e.g. "42%" or "Unpacking…". */
export function progressLabel(p: RuntimeProgress | undefined) {
  if (!p) return "Starting…";
  if (p.stage === "unpacking") return "Unpacking…";
  if (p.stage === "verifying") return "Checking…";
  if (p.total > 0) return `${Math.floor((p.downloaded / p.total) * 100)}%`;
  return `${(p.downloaded / 1_000_000).toFixed(0)} MB`;
}
