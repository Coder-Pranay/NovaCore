import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import { mapProfileUser } from "@/features/auth/utils/authorization";
import type { AuthenticatedUser } from "@/types/api";
import type {
  UpdateProfilePayload,
  UserProfile,
} from "@/features/settings/types";

const PROFILE_PATHS = {
  me: "/v1/users/me",
  avatar: "/v1/users/me/avatar",
} as const;

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      PROFILE_PATHS.me,
    );
    return response.data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const body = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      phoneNumber:
        payload.phoneNumber == null || payload.phoneNumber.trim() === ""
          ? null
          : payload.phoneNumber.trim(),
    };

    const response = await apiClient.put<ApiResponse<UserProfile>>(
      PROFILE_PATHS.me,
      body,
    );
    return response.data.data;
  },

  /**
   * Avatar upload endpoint is not available yet.
   * UI collects a file and calls this integration point.
   */
  async uploadAvatar(_file: File): Promise<never> {
    void _file;
    throw new Error(
      "Avatar upload is not available yet. Expected future endpoint: POST /v1/users/me/avatar",
    );
  },

  toAuthenticatedUser(profile: UserProfile): AuthenticatedUser {
    return mapProfileUser({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phoneNumber: profile.phoneNumber,
      profileImageUrl: profile.profileImageUrl,
      status: profile.status,
      emailVerified: profile.emailVerified,
      roles: profile.roles,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  },
};

export { PROFILE_PATHS };
