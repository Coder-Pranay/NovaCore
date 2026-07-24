"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ROUTES } from "@/constants";
import { authService } from "@/features/auth/api/auth-service";
import type { ResetPasswordFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/utils";

interface ResetPasswordVariables extends ResetPasswordFormValues {
  token: string;
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, password }: ResetPasswordVariables) =>
      authService.resetPassword({ token, password, confirmPassword: password }),
    onSuccess: () => {
      toast.success("Password reset successfully. You can sign in now.");
      router.replace(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to reset password"));
    },
  });
}
