import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - data is considered fresh for 30s
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (can be annoying for users)
    },
    mutations: {
      retry: 0, // Don't retry mutations (POST, PUT, DELETE) automatically
    },
  },
});
