import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  AuthSessionDevice,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UserProfileResponse,
  VerifyEmailRequest,
} from "@/features/auth/types";
import { mapLoginUser, mapProfileUser } from "@/features/auth/utils/authorization";
import type { AuthenticatedUser } from "@/types/api";

const AUTH_PATHS = {
  register: "/v1/auth/register",
  login: "/v1/auth/login",
  logout: "/v1/auth/logout",
  refresh: "/v1/auth/refresh",
  forgotPassword: "/v1/auth/forgot-password",
  resetPassword: "/v1/auth/reset-password",
  changePassword: "/v1/auth/change-password",
  verifyEmail: "/v1/auth/verify-email",
  resendVerification: "/v1/auth/resend-verification",
  sessions: "/v1/auth/sessions",
  revokeOtherSessions: "/v1/auth/sessions/revoke-others",
  currentUser: "/v1/users/me",
} as const;

async function postAuth<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(path, body);
  return response.data.data;
}

async function getAuth<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(path);
  return response.data.data;
}

export const authService = {
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      AUTH_PATHS.register,
      {
        email: request.email.trim().toLowerCase(),
        username: request.username.trim(),
        password: request.password,
        firstName: request.firstName.trim(),
        lastName: request.lastName.trim(),
      },
    );
    return response.data.data;
  },

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

  async logout(): Promise<void> {
    await postAuth<void>(AUTH_PATHS.logout, {});
  },

  async refresh(): Promise<RefreshResponse> {
    return postAuth<RefreshResponse>(AUTH_PATHS.refresh, {});
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

  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.verifyEmail, {
      token: request.token,
    });
  },

  async resendVerification(request: ResendVerificationRequest): Promise<void> {
    await postAuth<void>(AUTH_PATHS.resendVerification, {
      email: request.email.trim().toLowerCase(),
    });
  },

  async getSessions(): Promise<AuthSessionDevice[]> {
    return getAuth<AuthSessionDevice[]>(AUTH_PATHS.sessions);
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`${AUTH_PATHS.sessions}/${sessionId}`);
  },

  async revokeOtherSessions(): Promise<void> {
    await postAuth<void>(AUTH_PATHS.revokeOtherSessions, {});
  },
};

export { AUTH_PATHS };
