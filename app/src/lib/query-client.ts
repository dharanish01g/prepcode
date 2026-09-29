import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Files only change through this app, so cached data never goes stale on its own.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
