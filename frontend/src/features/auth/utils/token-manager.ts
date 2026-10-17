import axios from "axios";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types";
import type { RefreshResponse, UserProfileResponse } from "@/features/auth/types";
import { mapProfileUser } from "@/features/auth/utils/authorization";
import { useAuthStore } from "@/store/auth-store";

let refreshPromise: Promise<boolean> | null = null;

async function callRefreshEndpoint(): Promise<RefreshResponse> {
  const response = await axios.post<ApiResponse<RefreshResponse>>(
    `${env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
    {},
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30_000,
      withCredentials: true,
    },
  );

  return response.data.data;
}

async function fetchCurrentUserRaw() {
  const response = await axios.get<ApiResponse<UserProfileResponse>>(
    `${env.NEXT_PUBLIC_API_URL}/v1/users/me`,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30_000,
      withCredentials: true,
      // Avoid apiClient interceptor login redirects during bootstrap.
      validateStatus: (status) => status < 500,
    },
  );

  if (response.status === 401 || response.status === 403 || !response.data?.data) {
    throw new Error("Unauthorized");
  }

  return mapProfileUser(response.data.data);
}

/** Rotates HttpOnly auth cookies. Returns true when refresh succeeds. */
export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      await callRefreshEndpoint();
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Restores in-memory user state from HttpOnly cookies via /users/me,
 * refreshing cookies once if the access cookie has expired.
 * Uses raw axios so unauthenticated public/guest pages are not forced to /login.
 */
export async function restoreSession(): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("novacore.authUser");
      window.localStorage.removeItem("novacore.accessToken");
      window.localStorage.removeItem("novacore.refreshToken");
    } catch {
      // ignore quota / privacy mode
    }
  }

  const { setLoading, setUser, clear } = useAuthStore.getState();
  setLoading(true);

  try {
    try {
      const user = await fetchCurrentUserRaw();
      setUser(user);
      return true;
    } catch {
      const refreshed = await refreshSession();
      if (!refreshed) {
        clear();
        return false;
      }
      const user = await fetchCurrentUserRaw();
      setUser(user);
      return true;
    }
  } catch {
    clear();
    return false;
  } finally {
    setLoading(false);
  }
}
