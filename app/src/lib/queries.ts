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

// Keys include the register number so one student's cache can never be
// served to another (the whole cache is also cleared on logout).
export const queryKeys = {
  files: (regNo: string) => ["files", regNo] as const,
  fileContent: (regNo: string, filename: string) => ["file", regNo, filename] as const,
  fileHistory: (regNo: string) => ["file-history", regNo] as const,
};

export const SAVE_FILE_MUTATION_KEY = ["save-file"] as const;

function sortFiles(files: string[]) {
  return [...files].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function useFilesQuery(regNo: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.files(regNo),
    queryFn: listFiles,
  });

  // Students' files are small, so read them all up front: opening a file is
  // then instant instead of waiting on the disk.
  useEffect(() => {
    for (const filename of query.data ?? []) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.fileContent(regNo, filename),
        queryFn: () => readFile(filename),
      });
    }
  }, [query.data, queryClient, regNo]);

  return query;
}

/** Files with their last-edited times, newest first (for the History view). */
export function useFileHistoryQuery(regNo: string) {
  return useQuery({
    queryKey: queryKeys.fileHistory(regNo),
    queryFn: listFileHistory,
  });
}

/**
 * Marks the history out of date after any change to a file. It's only
 * re-read while the History view is showing, so this is cheap otherwise.
 */
function invalidateHistory(queryClient: ReturnType<typeof useQueryClient>, regNo: string) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.fileHistory(regNo) });
}

export function useCreateFileMutation(regNo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, extension }: { name: string; extension: string }) =>
      createFile(name, extension),
    onSuccess: (filename) => {
      queryClient.setQueryData<string[]>(queryKeys.files(regNo), (files = []) =>
        sortFiles([...files, filename]),
      );
      // New files start empty, so skip a pointless read.
      queryClient.setQueryData(queryKeys.fileContent(regNo, filename), "");
      invalidateHistory(queryClient, regNo);
    },
  });
}

export function useFileContentQuery(regNo: string, filename: string) {
  return useQuery({
    queryKey: queryKeys.fileContent(regNo, filename),
    queryFn: () => readFile(filename),
  });
}

export function useSaveFileMutation(regNo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: SAVE_FILE_MUTATION_KEY,
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      writeFile(filename, content),
    // Update the cache right away, so switching back to this file shows the
    // latest text even while the save is still in flight.
    onMutate: ({ filename, content }) => {
      queryClient.setQueryData(queryKeys.fileContent(regNo, filename), content);
    },
    onSuccess: () => invalidateHistory(queryClient, regNo),
  });
}

export function useRenameFileMutation(regNo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filename, newName }: { filename: string; newName: string }) =>
      renameFile(filename, newName),
    onSuccess: (newFilename, { filename }) => {
      queryClient.setQueryData<string[]>(queryKeys.files(regNo), (files = []) =>
        sortFiles([...files.filter((f) => f !== filename), newFilename]),
      );
      // Carry the text over, so the renamed file opens without a disk read.
      const content = queryClient.getQueryData<string>(queryKeys.fileContent(regNo, filename));
      queryClient.removeQueries({ queryKey: queryKeys.fileContent(regNo, filename), exact: true });
      if (content !== undefined) {
        queryClient.setQueryData(queryKeys.fileContent(regNo, newFilename), content);
      }
      invalidateHistory(queryClient, regNo);
    },
  });
}

export function useDeleteFileMutation(regNo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => deleteFile(filename),
    onSuccess: (_data, filename) => {
      queryClient.setQueryData<string[]>(queryKeys.files(regNo), (files = []) =>
        files.filter((f) => f !== filename),
      );
      queryClient.removeQueries({ queryKey: queryKeys.fileContent(regNo, filename), exact: true });
      invalidateHistory(queryClient, regNo);
    },
  });
}
