export const STORAGE_KEYS = {
  ACCESS_TOKEN: "novacore.accessToken",
  REFRESH_TOKEN: "novacore.refreshToken",
  AUTH_USER: "novacore.authUser",
  THEME: "novacore.theme",
  FAVORITE_PINS: "novacore.favoritePins",
  SHARING_STORE: "novacore.sharingStore",
  NOTIFICATIONS_STORE: "novacore.notificationsStore",
  NOTIFICATION_PREFERENCES: "novacore.notificationPreferences",
  USER_PREFERENCES: "novacore.userPreferences",
  ASSISTANT_STORE: "novacore.assistantStore",
  RECENT_SEARCHES: "novacore.recentSearches",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
