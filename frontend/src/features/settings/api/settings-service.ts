import type { UserPreferences } from "@/features/settings/types";
import {
  readUserPreferences,
  writeUserPreferences,
} from "@/features/settings/utils";

/**
 * Settings preferences service.
 * Theme syncs with next-themes via the UI; other prefs are local until a Settings API ships.
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

  /**
   * Session listing is unavailable — auth is JWT/stateless.
   */
  async getSessions(): Promise<never> {
    throw new Error(
      "Active session listing is not available. Authentication is JWT-based (stateless).",
    );
  },

  /**
   * Logout-other-sessions requires a future refresh-token admin API.
   */
  async logoutOtherSessions(): Promise<never> {
    throw new Error(
      "Revoking other sessions is not available yet. Use Sign out on this device.",
    );
  },
};
