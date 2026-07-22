import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ErrorResponse } from "@/types";

export type TokenGetter = () => string | null;

export type UnauthorizedHandler = () => void;

export type RefreshTokenHandler = () => Promise<string | null>;

export interface ApiClientAuthHandlers {
  getAccessToken: TokenGetter;
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: RefreshTokenHandler;
}

let authHandlers: ApiClientAuthHandlers = {
  getAccessToken: () => null,
};

export function configureApiClientAuth(handlers: ApiClientAuthHandlers): void {
  authHandlers = { ...authHandlers, ...handlers };
}

export function attachAuthHeader(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = authHandlers.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

export async function handleUnauthorizedError(): Promise<boolean> {
  if (!authHandlers.refreshAccessToken) {
    authHandlers.onUnauthorized?.();
    return false;
  }

  const newToken = await authHandlers.refreshAccessToken();

  if (!newToken) {
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
