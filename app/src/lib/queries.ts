import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFile,
  deleteFile,
  listFileHistory,
  listFiles,
  readFile,
  renameFile,
  writeFile,
} from "@/lib/files";
import { listTables, tableRows } from "@/lib/sql";
import { syncStatus } from "@/lib/sync";

// Keys include the workspace id so one student's cache can never be
// served to another (the whole cache is also cleared on logout).
export const queryKeys = {
  files: (userId: string) => ["files", userId] as const,
  fileContent: (userId: string, filename: string) => ["file", userId, filename] as const,
  fileHistory: (userId: string) => ["file-history", userId] as const,
  syncStatus: (userId: string) => ["sync-status", userId] as const,
  accountDetails: (userId: string) => ["account-details", userId] as const,
  // `runs` counts finished query runs: any run may change the tables.
  databaseTables: (database: string, runs: number) => ["database-tables", database, runs] as const,
  tableRows: (database: string, table: string, runs: number) =>
    ["table-rows", database, table, runs] as const,
};

/** The tables in the current database, refreshed after every run. */
export function useDatabaseTablesQuery(database: string | null | undefined, runs: number) {
  return useQuery({
    queryKey: queryKeys.databaseTables(database ?? "", runs),
    queryFn: listTables,
    enabled: Boolean(database),
  });
}

/** A table's rows, read when its tab opens and again after every run. */
export function useTableRowsQuery(database: string, table: string, runs: number) {
  return useQuery({
    queryKey: queryKeys.tableRows(database, table, runs),
    queryFn: () => tableRows(table),
  });
}

export const SAVE_FILE_MUTATION_KEY = ["save-file"] as const;

function sortFiles(files: string[]) {
  return [...files].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function useFilesQuery(userId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.files(userId),
    queryFn: listFiles,
  });

  // Students' files are small, so read them all up front: opening a file is
  // then instant instead of waiting on the disk.
  useEffect(() => {
    for (const filename of query.data ?? []) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.fileContent(userId, filename),
        queryFn: () => readFile(filename),
      });
    }
  }, [query.data, queryClient, userId]);

  return query;
}

/** Files with their last-edited times, newest first (for the History view). */
export function useFileHistoryQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.fileHistory(userId),
    queryFn: listFileHistory,
  });
}

/**
 * Marks the history and the sync status out of date after any change to a
 * file, so the sidebar's order and its unsynced marks catch up.
 */
function invalidateHistory(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus(userId) });
  return queryClient.invalidateQueries({ queryKey: queryKeys.fileHistory(userId) });
}

/** What isn't synced to GitHub yet. Students only: guests don't sync. */
export function useSyncStatusQuery(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.syncStatus(userId),
    queryFn: syncStatus,
    enabled,
  });
}

export function useCreateFileMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, extension }: { name: string; extension: string }) =>
      createFile(name, extension),
    onSuccess: (filename) => {
      queryClient.setQueryData<string[]>(queryKeys.files(userId), (files = []) =>
        sortFiles([...files, filename]),
      );
      // New files start empty, so skip a pointless read.
      queryClient.setQueryData(queryKeys.fileContent(userId, filename), "");
      invalidateHistory(queryClient, userId);
    },
  });
}

export function useFileContentQuery(userId: string, filename: string) {
  return useQuery({
    queryKey: queryKeys.fileContent(userId, filename),
    queryFn: () => readFile(filename),
  });
}

export function useSaveFileMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: SAVE_FILE_MUTATION_KEY,
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      writeFile(filename, content),
    // Update the cache right away, so switching back to this file shows the
    // latest text even while the save is still in flight.
    onMutate: ({ filename, content }) => {
      queryClient.setQueryData(queryKeys.fileContent(userId, filename), content);
    },
    onSuccess: () => invalidateHistory(queryClient, userId),
  });
}

export function useRenameFileMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filename, newName }: { filename: string; newName: string }) =>
      renameFile(filename, newName),
    onSuccess: (newFilename, { filename }) => {
      queryClient.setQueryData<string[]>(queryKeys.files(userId), (files = []) =>
        sortFiles([...files.filter((f) => f !== filename), newFilename]),
      );
      // Carry the text over, so the renamed file opens without a disk read.
      const content = queryClient.getQueryData<string>(queryKeys.fileContent(userId, filename));
      queryClient.removeQueries({ queryKey: queryKeys.fileContent(userId, filename), exact: true });
      if (content !== undefined) {
        queryClient.setQueryData(queryKeys.fileContent(userId, newFilename), content);
      }
      invalidateHistory(queryClient, userId);
    },
  });
}

export function useDeleteFileMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => deleteFile(filename),
    onSuccess: (_data, filename) => {
      queryClient.setQueryData<string[]>(queryKeys.files(userId), (files = []) =>
        files.filter((f) => f !== filename),
      );
      queryClient.removeQueries({ queryKey: queryKeys.fileContent(userId, filename), exact: true });
      invalidateHistory(queryClient, userId);
    },
  });
}
