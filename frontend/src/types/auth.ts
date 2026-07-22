export interface AuthState {
  accessToken: string | null;
  user: import("@/types/api").AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (accessToken: string, user: import("@/types/api").AuthenticatedUser) => void;
  logout: () => void;
  setUser: (user: import("@/types/api").AuthenticatedUser) => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export type AuthStore = AuthState & AuthActions;
