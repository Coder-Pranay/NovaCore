"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/features/auth/api/auth-service";
import { getErrorMessage } from "@/utils";

export function useRefresh() {
  return useMutation({
    mutationFn: () => authService.refresh(),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to refresh session"));
    },
  });
}
