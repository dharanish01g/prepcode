import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFile, listFiles, readFile, writeFile, type Extension } from "@/lib/files";

// Keys include the register number so one student's cache can never be
// served to another (the whole cache is also cleared on logout).
export const queryKeys = {
  files: (regNo: string) => ["files", regNo] as const,
  fileContent: (regNo: string, filename: string) => ["file", regNo, filename] as const,
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

export function useCreateFileMutation(regNo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, extension }: { name: string; extension: Extension }) =>
      createFile(name, extension),
    onSuccess: (filename) => {
      queryClient.setQueryData<string[]>(queryKeys.files(regNo), (files = []) =>
        sortFiles([...files, filename]),
      );
      // New files start empty, so skip a pointless read.
      queryClient.setQueryData(queryKeys.fileContent(regNo, filename), "");
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
  });
}
