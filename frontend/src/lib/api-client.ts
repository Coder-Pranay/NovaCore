import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ErrorResponse } from "@/types";

export type UnauthorizedHandler = () => void;

export type RefreshSessionHandler = () => Promise<boolean>;

export interface ApiClientAuthHandlers {
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: RefreshSessionHandler;
}

let authHandlers: ApiClientAuthHandlers = {};

export function configureApiClientAuth(handlers: ApiClientAuthHandlers): void {
  authHandlers = { ...authHandlers, ...handlers };
}

/** Cookies carry auth; no Authorization header is attached from JS. */
export function attachAuthHeader(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  return config;
}

export async function handleUnauthorizedError(): Promise<boolean> {
  if (!authHandlers.refreshAccessToken) {
    authHandlers.onUnauthorized?.();
    return false;
  }

  const refreshed = await authHandlers.refreshAccessToken();

  if (!refreshed) {
    authHandlers.onUnauthorized?.();
    return false;
  }

  return true;
}

export function isAxiosError(error: unknown): error is AxiosError<ErrorResponse> {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

export function getHttpStatusFromError(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

export { authHandlers };
