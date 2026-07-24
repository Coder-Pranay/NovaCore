"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/features/auth/api/auth-service";
import type { ForgotPasswordFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/utils";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      authService.forgotPassword({ email: values.email }),
    onSuccess: () => {
      toast.success("If an account exists, password reset instructions have been sent");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to process password reset request"));
    },
  });
}
