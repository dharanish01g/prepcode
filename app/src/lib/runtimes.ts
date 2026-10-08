import { useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { findLanguage } from "@/lib/languages";

/** Whether two languages share one download (e.g. C and C++). */
export function sameRuntime(a: string, b: string) {
  return findLanguage(a)?.runtime === findLanguage(b)?.runtime;
}

const RUNTIMES_KEY = ["runtimes"] as const;
const INSTALL_RUNTIME_KEY = ["install-runtime"] as const;

/** Languages whose runtime is installed on this computer. */
export function useInstalledRuntimes() {
  return useQuery({
    queryKey: RUNTIMES_KEY,
    queryFn: () => invoke<string[]>("list_runtimes"),
  });
}

export function useInstallRuntimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: INSTALL_RUNTIME_KEY,
    mutationFn: (extension: string) => invoke<void>("install_runtime", { extension }),
    onSettled: (_data, _error, extension) => {
      clearProgress(extension);
      return queryClient.invalidateQueries({ queryKey: RUNTIMES_KEY });
    },
  });
}

/** Deletes a programming language's download (and any language sharing it). */
export function useRemoveRuntimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (extension: string) => invoke<void>("remove_runtime", { extension }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: RUNTIMES_KEY }),
  });
}

/** Languages currently downloading, from any component. */
export function useInstallingRuntimes() {
  return useMutationState({
    filters: { mutationKey: INSTALL_RUNTIME_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables as string,
  });
}

// --- Progress events from install_runtime --------------------------------

export type RuntimeProgress = {
  extension: string;
  stage: "downloading" | "unpacking" | "verifying" | "configuring";
  downloaded: number;
  total: number;
};

let progress: Partial<Record<string, RuntimeProgress>> = {};
const listeners = new Set<() => void>();

function setProgress(next: typeof progress) {
  progress = next;
  listeners.forEach((notify) => notify());
}

function clearProgress(extension: string) {
  const { [extension]: _removed, ...rest } = progress;
  setProgress(rest);
}

// Registered once for the app's lifetime; installs keep running across dialogs.
listen<RuntimeProgress>("runtime-progress", (event) => {
  setProgress({ ...progress, [event.payload.extension]: event.payload });
});

/** Latest progress for a language's download, or undefined when idle. */
export function useRuntimeProgress(extension: string) {
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
  if (p.stage === "configuring") return "Setting up…";
  if (p.total > 0) return `${Math.floor((p.downloaded / p.total) * 100)}%`;
  return `${(p.downloaded / 1_000_000).toFixed(0)} MB`;
}
