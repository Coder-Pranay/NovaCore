export type NotificationCategory =
  | "ASSET_UPLOADED"
  | "ASSET_SHARED"
  | "SPACE_CREATED"
  | "SPACE_UPDATED"
  | "PERMISSION_CHANGED"
  | "COMMENT_ADDED"
  | "MENTION"
  | "STORAGE_WARNING"
  | "SYSTEM_ANNOUNCEMENT"
  | "SECURITY_ALERT";

export type NotificationStatus = "UNREAD" | "READ";

export type NotificationSortField = "createdAt" | "category" | "title";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  href?: string;
  entityType?: string;
  entityId?: string;
  source: "ACTIVITY" | "SYSTEM" | "LOCAL";
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
}

export interface NotificationListParams {
  q?: string;
  status?: NotificationStatus | "ALL";
  category?: NotificationCategory | "ALL";
  sortBy?: NotificationSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface NotificationListResult {
  items: AppNotification[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationGroup {
  label: "Today" | "Yesterday" | "This Week" | "Older";
  items: AppNotification[];
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "ASSET_UPLOADED",
  "ASSET_SHARED",
  "SPACE_CREATED",
  "SPACE_UPDATED",
  "PERMISSION_CHANGED",
  "COMMENT_ADDED",
  "MENTION",
  "STORAGE_WARNING",
  "SYSTEM_ANNOUNCEMENT",
  "SECURITY_ALERT",
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  pushEnabled: false,
  inAppEnabled: true,
  categories: {
    ASSET_UPLOADED: true,
    ASSET_SHARED: true,
    SPACE_CREATED: true,
    SPACE_UPDATED: true,
    PERMISSION_CHANGED: true,
    COMMENT_ADDED: true,
    MENTION: true,
    STORAGE_WARNING: true,
    SYSTEM_ANNOUNCEMENT: true,
    SECURITY_ALERT: true,
  },
};
