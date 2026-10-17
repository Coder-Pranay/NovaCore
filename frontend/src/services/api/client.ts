import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import {
  attachAuthHeader,
  configureApiClientAuth,
  getHttpStatusFromError,
  isNetworkError,
} from "@/lib/api-client";
import { parseApiError } from "@/utils/api-error";
import { useAuthStore } from "@/store/auth-store";
import { isGuestRoute, isPublicRoute, ROUTES } from "@/constants";
import { refreshSession } from "@/features/auth/utils/token-manager";
import { AUTH_PATHS } from "@/features/auth/api/auth-service";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30_000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

type QueueEntry = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

function shouldSkipAuthRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }

  return [
    AUTH_PATHS.register,
    AUTH_PATHS.login,
    AUTH_PATHS.refresh,
    AUTH_PATHS.logout,
    AUTH_PATHS.forgotPassword,
    AUTH_PATHS.resetPassword,
    "/v1/public-links/open/",
  ].some((path) => url.includes(path));
}

function processQueue(error: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
  failedQueue = [];
}

/** Never bounce guests/public share landings to login on bootstrap 401s. */
export function redirectToLogin(): void {
  useAuthStore.getState().clear();

  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;
  if (
    pathname === ROUTES.LOGIN ||
    isGuestRoute(pathname) ||
    isPublicRoute(pathname)
  ) {
    return;
  }

  const next = encodeURIComponent(pathname);
  window.location.assign(`${ROUTES.LOGIN}?next=${next}`);
}

configureApiClientAuth({
  onUnauthorized: redirectToLogin,
  refreshAccessToken: refreshSession,
});

apiClient.interceptors.request.use(attachAuthHeader);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = getHttpStatusFromError(error);
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh &&
      !shouldSkipAuthRefresh(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await refreshSession();

        if (!refreshed) {
          processQueue(error);
          redirectToLogin();
          return Promise.reject(parseApiError(error, "Your session has expired"));
        }

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        redirectToLogin();
        return Promise.reject(parseApiError(refreshError, "Your session has expired"));
      } finally {
        isRefreshing = false;
      }
    }

    if (isNetworkError(error)) {
      return Promise.reject(parseApiError(error, "Network connection failed"));
    }

    if (status === 403) {
      return Promise.reject(
        parseApiError(error, "You do not have permission to perform this action"),
      );
    }

    if (status === 404) {
      return Promise.reject(parseApiError(error, "The requested resource was not found"));
    }

    if (status === 422) {
      return Promise.reject(parseApiError(error, "Please check your input and try again"));
    }

    if (status === 429) {
      return Promise.reject(parseApiError(error, "Too many requests. Please try again later"));
    }

    if (status === 500) {
      return Promise.reject(parseApiError(error, "An unexpected server error occurred"));
    }

    return Promise.reject(parseApiError(error));
  },
);

export type ApiClient = typeof apiClient;
