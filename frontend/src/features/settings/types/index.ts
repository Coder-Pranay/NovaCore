export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  status: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

export type ThemePreference = "light" | "dark" | "system";
export type DateFormatPreference = "MMM d, yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd";
export type NumberFormatPreference = "en-US" | "en-IN" | "de-DE";

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  timezone: string;
  dateFormat: DateFormatPreference;
  numberFormat: NumberFormatPreference;
  organizationName: string;
  reduceMotion: boolean;
  highContrast: boolean;
  compactMode: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "system",
  language: "en",
  timezone: "UTC",
  dateFormat: "MMM d, yyyy",
  numberFormat: "en-US",
  organizationName: "",
  reduceMotion: false,
  highContrast: false,
  compactMode: false,
};

export type SettingsSection =
  | "general"
  | "appearance"
  | "security"
  | "notifications"
  | "sessions"
  | "preferences"
  | "api-keys"
  | "connected-accounts";
