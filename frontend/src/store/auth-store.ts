import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants";
import type { AuthStore, AuthSessionInput, TokenPair } from "@/types/auth";
import type { AuthenticatedUser } from "@/types";
import { resolvePermissions } from "@/features/auth/utils/authorization";
import { clearAuthCookie, setAuthCookie } from "@/features/auth/utils/cookie-sync";

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  rememberMe: false,
} satisfies Pick<
  AuthStore,
  | "accessToken"
  | "refreshToken"
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
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: { ...session.user, roles, permissions },
    roles,
    permissions,
    isAuthenticated: true,
    isLoading: false,
    rememberMe: session.rememberMe ?? false,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSession: (session) => {
        set(buildAuthPatch(session));
        setAuthCookie(session.rememberMe ?? false);
      },

      setTokens: ({ accessToken, refreshToken }: TokenPair) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

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
        clearAuthCookie();
        set({ ...initialState, isLoading: false });
      },

      login: (accessToken, user) => {
        set(
          buildAuthPatch({
            accessToken,
            refreshToken: useAuthStore.getState().refreshToken ?? "",
            user,
          }),
        );
      },

      logout: () => {
        clearAuthCookie();
        set({ ...initialState, isLoading: false });
      },

      setAccessToken: (accessToken: string) =>
        set({ accessToken, isAuthenticated: true }),
    }),
    {
      name: STORAGE_KEYS.AUTH_USER,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        roles: state.roles,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => () => {
        // Session restore handled by AuthProvider
      },
    },
  ),
);

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export function getAuthUser(): AuthenticatedUser | null {
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}
