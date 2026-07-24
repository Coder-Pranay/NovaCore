import { STORAGE_KEYS } from "@/constants";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type AppNotification,
  type NotificationPreferences,
} from "@/features/notifications/types";

export interface NotificationsStoreState {
  notifications: AppNotification[];
  syncedActivityIds: string[];
}

const EMPTY_STORE: NotificationsStoreState = {
  notifications: [],
  syncedActivityIds: [],
};

export function readNotificationsStore(): NotificationsStoreState {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_STORE);
    if (!raw) {
      return { notifications: [], syncedActivityIds: [] };
    }
    const parsed = JSON.parse(raw) as NotificationsStoreState;
    return {
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      syncedActivityIds: Array.isArray(parsed.syncedActivityIds)
        ? parsed.syncedActivityIds
        : [],
    };
  } catch {
    return { notifications: [], syncedActivityIds: [] };
  }
}

export function writeNotificationsStore(state: NotificationsStoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.NOTIFICATIONS_STORE,
    JSON.stringify(state),
  );
}

export function updateNotificationsStore(
  updater: (current: NotificationsStoreState) => NotificationsStoreState,
): NotificationsStoreState {
  const next = updater(readNotificationsStore());
  writeNotificationsStore(next);
  return next;
}

export function readNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(
      STORAGE_KEYS.NOTIFICATION_PREFERENCES,
    );
    if (!raw) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(JSON.parse(raw) as NotificationPreferences),
      categories: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
        ...(JSON.parse(raw) as NotificationPreferences).categories,
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function writeNotificationPreferences(
  preferences: NotificationPreferences,
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.NOTIFICATION_PREFERENCES,
    JSON.stringify(preferences),
  );
}
