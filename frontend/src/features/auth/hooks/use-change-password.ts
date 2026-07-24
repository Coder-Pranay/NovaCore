"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/features/auth/api/auth-service";
import type { ChangePasswordFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/utils";

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to change password"));
    },
  });
}
