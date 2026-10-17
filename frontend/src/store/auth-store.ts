import { create } from "zustand";
import type { AuthStore, AuthSessionInput } from "@/types/auth";
import type { AuthenticatedUser } from "@/types";
import { resolvePermissions } from "@/features/auth/utils/authorization";

/**
 * In-memory auth UI state only. JWTs live in HttpOnly cookies — never localStorage.
 */
const initialState = {
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  rememberMe: false,
} satisfies Pick<
  AuthStore,
  | "user"
  | "roles"
  | "permissions"
  | "isAuthenticated"
  | "isLoading"
  | "rememberMe"
>;

function buildAuthPatch(session: AuthSessionInput) {
  const roles = session.user.roles ?? [];
  const permissions = session.user.permissions ?? resolvePermissions(roles);

  return {
    user: { ...session.user, roles, permissions },
    roles,
    permissions,
    isAuthenticated: true,
    isLoading: false,
    rememberMe: session.rememberMe ?? false,
  };
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,

  setSession: (session) => {
    set(buildAuthPatch(session));
  },

  setUser: (user: AuthenticatedUser) => {
    const roles = user.roles ?? [];
    const permissions = user.permissions ?? resolvePermissions(roles);

    set({
      user: { ...user, roles, permissions },
      roles,
      permissions,
      isAuthenticated: true,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  clear: () => {
    set({ ...initialState, isLoading: false });
  },
}));

export function getAuthUser(): AuthenticatedUser | null {
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}
