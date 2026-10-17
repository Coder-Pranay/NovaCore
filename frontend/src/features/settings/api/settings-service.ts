import type { AuthSessionDevice } from "@/features/auth/types";
import { authService } from "@/features/auth/api/auth-service";
import type { UserPreferences } from "@/features/settings/types";
import {
  readUserPreferences,
  writeUserPreferences,
} from "@/features/settings/utils";

/**
 * Settings preferences + authenticated session management.
 */
export const settingsService = {
  async getPreferences(): Promise<UserPreferences> {
    return readUserPreferences();
  },

  async updatePreferences(
    preferences: UserPreferences,
  ): Promise<UserPreferences> {
    writeUserPreferences(preferences);
    return preferences;
  },

  async getSessions(): Promise<AuthSessionDevice[]> {
    return authService.getSessions();
  },

  async revokeSession(sessionId: string): Promise<void> {
    await authService.revokeSession(sessionId);
  },

  async logoutOtherSessions(): Promise<void> {
    await authService.revokeOtherSessions();
  },
};
