"use client";

import { useEffect } from "react";
import { configureApiClientAuth } from "@/lib/api-client";
import { getAccessToken, useAuthStore } from "@/store/auth-store";
import { ROUTES } from "@/constants";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setLoading = useAuthStore((state) => state.setLoading);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken,
      onUnauthorized: () => {
        clear();

        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.assign(ROUTES.LOGIN);
        }
      },
      refreshAccessToken: async () => {
        // Pluggable refresh flow — implemented in Sprint 9.2
        return null;
      },
    });

    setLoading(false);
  }, [clear, setLoading]);

  return children;
}
