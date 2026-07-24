import { QueryClient, type DefaultOptions } from "@tanstack/react-query";
import {
  API_DEFAULT_GC_TIME_MS,
  API_DEFAULT_RETRY_COUNT,
  API_DEFAULT_STALE_TIME_MS,
} from "@/constants";

export type QueryErrorHandler = (error: unknown) => void;

let globalQueryErrorHandler: QueryErrorHandler | undefined;

export function setQueryErrorHandler(handler: QueryErrorHandler): void {
  globalQueryErrorHandler = handler;
}

export function getQueryClientConfig(): DefaultOptions {
  return {
    queries: {
      staleTime: API_DEFAULT_STALE_TIME_MS,
      gcTime: API_DEFAULT_GC_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: API_DEFAULT_RETRY_COUNT,
    },
    mutations: {
      retry: 0,
    },
  };
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: getQueryClientConfig(),
  });
}

export function handleQueryError(error: unknown): void {
  globalQueryErrorHandler?.(error);
}
