import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  ResetPasswordRequest,
  UserProfileResponse,
} from "@/features/auth/types";
import { mapLoginUser, mapProfileUser } from "@/features/auth/utils/authorization";
import type { AuthenticatedUser } from "@/types/api";

const AUTH_PATHS = {
  login: "/v1/auth/login",
  logout: "/v1/auth/logout",
  refresh: "/v1/auth/refresh",
  forgotPassword: "/v1/auth/forgot-password",
  resetPassword: "/v1/auth/reset-password",
  changePassword: "/v1/auth/change-password",
  currentUser: "/v1/users/me",
} as const;

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(path, body);
  return response.data.data;
}

async function getAuth<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(path);
  return response.data.data;
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse & { user: AuthenticatedUser }> {
    const data = await postAuth<Omit<LoginResponse, "user"> & { user: LoginResponse["user"] }>(
      AUTH_PATHS.login,
      {
        emailOrUsername: request.emailOrUsername.trim(),
        password: request.password,
      },
    );

    return {
      ...data,
      user: mapLoginUser(data.user),
    };
  },

  async logout(request: LogoutRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.logout, request);
  },

  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>(
      AUTH_PATHS.refresh,
      request,
    );

    return response.data.data;
  },

  async getCurrentUser(): Promise<AuthenticatedUser> {
    const profile = await getAuth<UserProfileResponse>(AUTH_PATHS.currentUser);
    return mapProfileUser(profile);
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.forgotPassword, {
      email: request.email.trim().toLowerCase(),
    });
  },

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.resetPassword, {
      token: request.token,
      password: request.password,
    });
  },

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.changePassword, {
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
    });
  },
};

export { AUTH_PATHS };
