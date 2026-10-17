import type { AuthenticatedUser } from "@/types/api";

export interface AuthState {
  user: AuthenticatedUser | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
}

export interface AuthSessionInput {
  user: AuthenticatedUser;
  rememberMe?: boolean;
}

export interface AuthActions {
  setSession: (session: AuthSessionInput) => void;
  setUser: (user: AuthenticatedUser) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export type AuthStore = AuthState & AuthActions;
