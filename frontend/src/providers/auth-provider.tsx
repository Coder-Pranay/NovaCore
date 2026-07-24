"use client";

import { useEffect } from "react";
import { configureApiClientAuth } from "@/lib/api-client";
import {
  refreshSession,
  restoreSession,
} from "@/features/auth/utils/token-manager";
import { getAccessToken, useAuthStore } from "@/store/auth-store";
import { ROUTES } from "@/constants";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken,
      onUnauthorized: () => {
        useAuthStore.getState().clear();

        if (window.location.pathname !== ROUTES.LOGIN) {
          const next = encodeURIComponent(window.location.pathname);
          window.location.assign(`${ROUTES.LOGIN}?next=${next}`);
        }
      },
      refreshAccessToken: refreshSession,
    });

    void restoreSession().finally(() => setLoading(false));
  }, [setLoading]);

  return children;
}
