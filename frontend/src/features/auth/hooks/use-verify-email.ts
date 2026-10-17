"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/features/auth/api/auth-service";
import type { ResendVerificationFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/utils";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail({ token }),
    onSuccess: () => {
      toast.success("Email verified successfully. You can sign in now.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to verify email"));
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (values: ResendVerificationFormValues) =>
      authService.resendVerification({ email: values.email }),
    onSuccess: () => {
      toast.success(
        "If an account needs verification, a new email has been sent",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to resend verification email"));
    },
  });
}
