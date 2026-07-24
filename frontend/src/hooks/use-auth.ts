"use client";

import { useAuthStore } from "@/store/auth-store";
import {
  canAccess,
  hasPermission,
  hasRole,
} from "@/features/auth/utils/authorization";

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const rememberMe = useAuthStore((state) => state.rememberMe);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clear = useAuthStore((state) => state.clear);

  return {
    accessToken,
    refreshToken,
    user,
    roles,
    permissions,
    isAuthenticated,
    isLoading,
    rememberMe,
    setSession,
    setUser,
    setTokens,
    setLoading,
    clear,
    hasRole: (role: string) => hasRole(user, role),
    hasPermission: (permission: string) => hasPermission(user, permission),
    canAccess: (options: {
      roles?: string[];
      permissions?: string[];
      requireAll?: boolean;
    }) => canAccess(user, options),
  };
}

export {
  useLogin,
  useLogout,
  useRefresh,
  useCurrentUser,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
} from "@/features/auth/hooks";
