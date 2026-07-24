export const APP_NAME = "NovaCore";
export const APP_DESCRIPTION = "Personal Digital Operating System";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const API_DEFAULT_STALE_TIME_MS = 60_000;
export const API_DEFAULT_GC_TIME_MS = 5 * 60_000;
export const API_DEFAULT_RETRY_COUNT = 1;

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 50,
} as const;

export const SEARCH = {
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_MS: 300,
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
} as const;
