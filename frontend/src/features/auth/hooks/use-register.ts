"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ROUTES } from "@/constants";
import { authService } from "@/features/auth/api/auth-service";
import type { RegisterFormValues } from "@/features/auth/schemas";
import { getErrorMessage, parseApiError } from "@/utils";
import { isNetworkError } from "@/lib/api-client";

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authService.register({
        email: values.email,
        username: values.username,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      }),
    onSuccess: () => {
      toast.success(
        "Account created. Check your email to verify, then sign in.",
      );
      router.replace(ROUTES.LOGIN);
    },
    onError: (error) => {
      if (isNetworkError(error)) {
        toast.error("Network error. Check your connection and try again.");
        return;
      }

      const apiError = parseApiError(error, "Unable to create account");
      if (apiError.status === 409) {
        toast.error(apiError.message);
        return;
      }

      if (apiError.status === 400) {
        const detail = apiError.errors?.join("; ");
        toast.error(detail || apiError.message || "Please fix the highlighted fields");
        return;
      }

      toast.error(getErrorMessage(error, "Unable to create account"));
    },
  });
}
