import { STORAGE_KEYS } from "@/constants";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/features/settings/types";

export function readUserPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!raw) {
      return DEFAULT_USER_PREFERENCES;
    }
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...(JSON.parse(raw) as UserPreferences),
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeUserPreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.USER_PREFERENCES,
    JSON.stringify(preferences),
  );
}

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
] as const;
