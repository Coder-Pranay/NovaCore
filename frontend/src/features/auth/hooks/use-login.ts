"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS, ROUTES } from "@/constants";
import { authService } from "@/features/auth/api/auth-service";
import type { LoginFormValues } from "@/features/auth/schemas";
import { getSafeRedirectPath } from "@/features/auth/utils/redirect";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const response = await authService.login({
        emailOrUsername: values.emailOrUsername,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      return {
        ...response,
        rememberMe: values.rememberMe,
      };
    },
    onSuccess: (response) => {
      setSession({
        user: response.user,
        rememberMe: response.rememberMe,
      });

      queryClient.setQueryData(QUERY_KEYS.auth.currentUser, response.user);

      const next = getSafeRedirectPath(searchParams.get("next"), ROUTES.DASHBOARD);
      router.replace(next);
      toast.success("Signed in successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Invalid email/username or password"));
    },
  });
}
