import { dashboardService } from "@/features/dashboard/api/dashboard-service";
import {
  readNotificationPreferences,
  readNotificationsStore,
  updateNotificationsStore,
  writeNotificationPreferences,
} from "@/features/notifications/api/notification-store";
import type {
  AppNotification,
  NotificationListParams,
  NotificationListResult,
  NotificationPreferences,
} from "@/features/notifications/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
} from "@/features/notifications/types";
import {
  activityToNotification,
  createNotificationId,
  filterNotifications,
} from "@/features/notifications/utils";

function ensureSystemSeed(notifications: AppNotification[]): AppNotification[] {
  const hasSystem = notifications.some((item) => item.source === "SYSTEM");
  if (hasSystem) {
    return notifications;
  }

  const now = Date.now();
  const seeds: AppNotification[] = [
    {
      id: createNotificationId(),
      category: "SYSTEM_ANNOUNCEMENT",
      title: "Welcome to NovaCore notifications",
      body: "Inbox is client-local until the Notifications API ships. Activity events sync automatically.",
      status: "UNREAD",
      createdAt: new Date(now - 60_000).toISOString(),
      source: "SYSTEM",
    },
    {
      id: createNotificationId(),
      category: "STORAGE_WARNING",
      title: "Storage soft quota reminder",
      body: "Analytics uses a 10 GB soft quota until backend storage quotas are available.",
      status: "UNREAD",
      createdAt: new Date(now - 120_000).toISOString(),
      source: "SYSTEM",
      href: "/analytics",
    },
    {
      id: createNotificationId(),
      category: "SECURITY_ALERT",
      title: "Review signed-in sessions",
      body: "Keep your account secure by changing your password periodically.",
      status: "READ",
      createdAt: new Date(now - 86_400_000).toISOString(),
      source: "SYSTEM",
      href: "/settings/change-password",
    },
  ];

  return [...seeds, ...notifications];
}

export const notificationService = {
  async syncFromActivity(): Promise<AppNotification[]> {
    const activities = await dashboardService.getRecentActivity();
    const mapped = activities.map(activityToNotification);

    return updateNotificationsStore((current) => {
      const known = new Set(current.syncedActivityIds);
      const incoming = mapped.filter((item) => {
        const activityId = item.id.replace(/^activity:/, "");
        return !known.has(activityId);
      });

      const merged = ensureSystemSeed([
        ...incoming,
        ...current.notifications,
      ]);

      return {
        notifications: merged,
        syncedActivityIds: Array.from(
          new Set([
            ...current.syncedActivityIds,
            ...mapped.map((item) => item.id.replace(/^activity:/, "")),
          ]),
        ),
      };
    }).notifications;
  },

  async getNotifications(
    params: NotificationListParams = {},
  ): Promise<NotificationListResult> {
    await this.syncFromActivity();
    const store = readNotificationsStore();
    const preferences = readNotificationPreferences();
    return filterNotifications(store.notifications, preferences, params);
  },

  async getUnreadCount(): Promise<number> {
    await this.syncFromActivity();
    const store = readNotificationsStore();
    const preferences = readNotificationPreferences();
    if (!preferences.inAppEnabled) {
      return 0;
    }
    return store.notifications.filter(
      (item) =>
        item.status === "UNREAD" && preferences.categories[item.category],
    ).length;
  },

  async markRead(id: string): Promise<AppNotification | null> {
    let updated: AppNotification | null = null;
    updateNotificationsStore((current) => ({
      ...current,
      notifications: current.notifications.map((item) => {
        if (item.id !== id) {
          return item;
        }
        updated = { ...item, status: "READ" };
        return updated;
      }),
    }));
    return updated;
  },

  async markAllRead(): Promise<number> {
    let count = 0;
    updateNotificationsStore((current) => ({
      ...current,
      notifications: current.notifications.map((item) => {
        if (item.status === "UNREAD") {
          count += 1;
          return { ...item, status: "READ" };
        }
        return item;
      }),
    }));
    return count;
  },

  async deleteNotification(id: string): Promise<void> {
    updateNotificationsStore((current) => ({
      ...current,
      notifications: current.notifications.filter((item) => item.id !== id),
    }));
  },

  async getPreferences(): Promise<NotificationPreferences> {
    return readNotificationPreferences();
  },

  async updatePreferences(
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const next: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...preferences,
      categories: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
        ...preferences.categories,
      },
    };

    for (const category of NOTIFICATION_CATEGORIES) {
      next.categories[category] = Boolean(next.categories[category]);
    }

    writeNotificationPreferences(next);
    return next;
  },
};
