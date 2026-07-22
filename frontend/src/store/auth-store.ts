import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants";
import type { AuthStore } from "@/types/auth";
import type { AuthenticatedUser } from "@/types";

const initialState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
} satisfies Pick<
  AuthStore,
  "accessToken" | "user" | "isAuthenticated" | "isLoading"
>;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: (accessToken, user) =>
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setUser: (user: AuthenticatedUser) => set({ user }),

      setAccessToken: (accessToken: string) =>
        set({ accessToken, isAuthenticated: true }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      clear: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: STORAGE_KEYS.AUTH_USER,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    },
  ),
);

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getAuthUser(): AuthenticatedUser | null {
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}
