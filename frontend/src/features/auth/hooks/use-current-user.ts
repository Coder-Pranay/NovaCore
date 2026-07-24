"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { authService } from "@/features/auth/api/auth-service";
import { useAuthStore } from "@/store/auth-store";

export function useCurrentUser(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: QUERY_KEYS.auth.currentUser,
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
