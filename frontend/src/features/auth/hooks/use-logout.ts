"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS, ROUTES } from "@/constants";
import { authService } from "@/features/auth/api/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils";

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSettled: () => {
      clear();
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.currentUser });
      router.replace(ROUTES.LOGIN);
      toast.success("Signed out successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to sign out completely"));
    },
  });
}
