import type { AuthenticatedUser } from "@/types/api";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthenticatedUser | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
}

export interface AuthSessionInput {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
  rememberMe?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthActions {
  setSession: (session: AuthSessionInput) => void;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: AuthenticatedUser) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
  /** @deprecated Use setSession instead */
  login: (accessToken: string, user: AuthenticatedUser) => void;
  /** @deprecated Use clear instead */
  logout: () => void;
  /** @deprecated Use setTokens instead */
  setAccessToken: (accessToken: string) => void;
}

export type AuthStore = AuthState & AuthActions;
