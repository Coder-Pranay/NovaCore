import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import {
  attachAuthHeader,
  configureApiClientAuth,
  getHttpStatusFromError,
  handleUnauthorizedError,
  isNetworkError,
} from "@/lib/api-client";
import { parseApiError } from "@/utils/api-error";
import { getAccessToken, useAuthStore } from "@/store/auth-store";
import { ROUTES } from "@/constants";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30_000,
});

let refreshPromise: Promise<string | null> | null = null;

configureApiClientAuth({
  getAccessToken,
  onUnauthorized: () => {
    useAuthStore.getState().clear();

    if (typeof window !== "undefined" && window.location.pathname !== ROUTES.LOGIN) {
      window.location.assign(ROUTES.LOGIN);
    }
  },
  refreshAccessToken: async () => {
    if (!refreshPromise) {
      refreshPromise = Promise.resolve(null).finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  },
});

apiClient.interceptors.request.use(attachAuthHeader);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = getHttpStatusFromError(error);
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await handleUnauthorizedError();

      if (refreshed) {
        attachAuthHeader(originalRequest);
        return apiClient(originalRequest);
      }
    }

    if (isNetworkError(error)) {
      return Promise.reject(parseApiError(error, "Network connection failed"));
    }

    if (status === 403) {
      return Promise.reject(parseApiError(error, "You do not have permission to perform this action"));
    }

    if (status === 500) {
      return Promise.reject(parseApiError(error, "An unexpected server error occurred"));
    }

    return Promise.reject(parseApiError(error));
  },
);

export type ApiClient = typeof apiClient;
