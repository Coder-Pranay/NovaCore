import axios from "axios";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types";
import type { RefreshResponse } from "@/features/auth/types";
import { clearAuthCookie, setAuthCookie } from "@/features/auth/utils/cookie-sync";
import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
} from "@/store/auth-store";
import { authService } from "@/features/auth/api/auth-service";

let refreshPromise: Promise<string | null> | null = null;

async function callRefreshEndpoint(refreshToken: string): Promise<RefreshResponse> {
  const response = await axios.post<ApiResponse<RefreshResponse>>(
    `${env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
    { refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30_000,
    },
  );

  return response.data.data;
}

export async function refreshSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await callRefreshEndpoint(refreshToken);
      const rememberMe = useAuthStore.getState().rememberMe;

      useAuthStore.getState().setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setAuthCookie(rememberMe);

      return response.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function restoreSession(): Promise<boolean> {
  const { accessToken, refreshToken, setLoading, setUser, clear } =
    useAuthStore.getState();

  if (!accessToken && !refreshToken) {
    setLoading(false);
    clearAuthCookie();
    return false;
  }

  setLoading(true);

  try {
    if (accessToken) {
      const user = await authService.getCurrentUser();
      setUser(user);
      setAuthCookie(useAuthStore.getState().rememberMe);
      return true;
    }

    const newAccessToken = await refreshSession();

    if (!newAccessToken) {
      clear();
      clearAuthCookie();
      return false;
    }

    const user = await authService.getCurrentUser();
    setUser(user);
    setAuthCookie(useAuthStore.getState().rememberMe);
    return true;
  } catch {
    clear();
    clearAuthCookie();
    return false;
  } finally {
    setLoading(false);
  }
}

export function getStoredAccessToken(): string | null {
  return getAccessToken();
}
