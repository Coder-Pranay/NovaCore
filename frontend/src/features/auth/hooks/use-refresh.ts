"use client";

import { useMutation } from "@tanstack/react-query";

import { authService } from "@/features/auth/api/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { getRefreshToken } from "@/store/auth-store";
import { getErrorMessage } from "@/utils";
import { toast } from "sonner";

export function useRefresh() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      return authService.refresh({ refreshToken });
    },
    onSuccess: (response) => {
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to refresh session"));
    },
  });
}
