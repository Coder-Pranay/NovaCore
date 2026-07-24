import type { RecentActivityItem } from "@/features/dashboard/types";
import type {
  AppNotification,
  NotificationCategory,
  NotificationGroup,
  NotificationListParams,
  NotificationListResult,
  NotificationPreferences,
} from "@/features/notifications/types";

export function categoryLabel(category: NotificationCategory): string {
  switch (category) {
    case "ASSET_UPLOADED":
      return "Asset uploaded";
    case "ASSET_SHARED":
      return "Asset shared";
    case "SPACE_CREATED":
      return "Space created";
    case "SPACE_UPDATED":
      return "Space updated";
    case "PERMISSION_CHANGED":
      return "Permission changed";
    case "COMMENT_ADDED":
      return "Comment added";
    case "MENTION":
      return "Mention";
    case "STORAGE_WARNING":
      return "Storage warning";
    case "SYSTEM_ANNOUNCEMENT":
      return "System announcement";
    case "SECURITY_ALERT":
      return "Security alert";
    default:
      return category;
  }
}

export function mapActivityToCategory(
  activity: RecentActivityItem,
): NotificationCategory {
  if (activity.entityType === "ASSET" && activity.action === "UPLOADED") {
    return "ASSET_UPLOADED";
  }
  if (activity.entityType === "SPACE" && activity.action === "CREATED") {
    return "SPACE_CREATED";
  }
  if (activity.entityType === "SPACE" && activity.action === "UPDATED") {
    return "SPACE_UPDATED";
  }
  if (activity.action === "FAVORITED" || activity.action === "UNFAVORITED") {
    return "SYSTEM_ANNOUNCEMENT";
  }
  if (activity.action === "ARCHIVED") {
    return "SYSTEM_ANNOUNCEMENT";
  }
  return "SYSTEM_ANNOUNCEMENT";
}

export function activityToNotification(
  activity: RecentActivityItem,
): AppNotification {
  return {
    id: `activity:${activity.id}`,
    category: mapActivityToCategory(activity),
    title: activity.title,
    body: activity.description ?? `${activity.action} on ${activity.entityType}`,
    status: "UNREAD",
    createdAt: activity.createdAt,
    entityType: activity.entityType,
    entityId: activity.entityId,
    source: "ACTIVITY",
    href:
      activity.entityType === "SPACE"
        ? `/spaces/${activity.entityId}`
        : undefined,
  };
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function groupNotificationsByDate(
  items: AppNotification[],
): NotificationGroup[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<NotificationGroup["label"], AppNotification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  for (const item of items) {
    const ts = new Date(item.createdAt).getTime();
    if (ts >= today) {
      buckets.Today.push(item);
    } else if (ts >= yesterday) {
      buckets.Yesterday.push(item);
    } else if (ts >= weekAgo) {
      buckets["This Week"].push(item);
    } else {
      buckets.Older.push(item);
    }
  }

  return (["Today", "Yesterday", "This Week", "Older"] as const)
    .map((label) => ({ label, items: buckets[label] }))
    .filter((group) => group.items.length > 0);
}

export function filterNotifications(
  items: AppNotification[],
  preferences: NotificationPreferences,
  params: NotificationListParams = {},
): NotificationListResult {
  const {
    q = "",
    status = "ALL",
    category = "ALL",
    sortBy = "createdAt",
    sortDir = "desc",
    page = 0,
    size = 20,
  } = params;

  const query = q.trim().toLowerCase();

  let filtered = items.filter((item) => {
    if (!preferences.inAppEnabled) {
      return false;
    }
    if (!preferences.categories[item.category]) {
      return false;
    }
    if (status !== "ALL" && item.status !== status) {
      return false;
    }
    if (category !== "ALL" && item.category !== category) {
      return false;
    }
    if (query) {
      const haystack = `${item.title} ${item.body} ${item.category}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title) * dir;
      case "category":
        return a.category.localeCompare(b.category) * dir;
      case "createdAt":
      default:
        return a.createdAt.localeCompare(b.createdAt) * dir;
    }
  });

  const total = filtered.length;
  const safeSize = Math.min(Math.max(size, 1), 50);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const safePage = Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0));
  const start = safePage * safeSize;
  const pageItems = filtered.slice(0, start + safeSize);

  return {
    items: pageItems,
    total,
    page: safePage,
    size: safeSize,
    totalPages,
    hasMore: start + safeSize < total,
    unreadCount: items.filter((item) => item.status === "UNREAD").length,
  };
}

export function createNotificationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
