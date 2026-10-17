"use client";

import { useEffect } from "react";
import { configureApiClientAuth } from "@/lib/api-client";
import {
  refreshSession,
  restoreSession,
} from "@/features/auth/utils/token-manager";
import { useAuthStore } from "@/store/auth-store";
import { redirectToLogin } from "@/services/api/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    configureApiClientAuth({
      onUnauthorized: redirectToLogin,
      refreshAccessToken: refreshSession,
    });

    void restoreSession().finally(() => setLoading(false));
  }, [setLoading]);

  return children;
}
