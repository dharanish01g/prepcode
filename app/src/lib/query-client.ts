import { QueryClient } from "@tanstack/react-query";

// Most queries and mutations are local (files, languages, running code), so
// they must run without internet. By default TanStack Query pauses everything
// while offline: saves then never reached the disk, so Run ran the old code,
// and installed languages showed as not installed. Those that do need the
// internet (Practice, Jobs, Sync) fail and show their offline message instead.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Files only change through this app, so cached data never goes stale on its own.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
    },
  },
});
