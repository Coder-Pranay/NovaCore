export const STORAGE_KEYS = {
  ACCESS_TOKEN: "novacore.accessToken",
  REFRESH_TOKEN: "novacore.refreshToken",
  AUTH_USER: "novacore.authUser",
  THEME: "novacore.theme",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
