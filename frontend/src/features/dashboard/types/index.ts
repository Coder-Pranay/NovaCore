export type AssetType =
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "PDF"
  | "NOTE"
  | "LINK"
  | "FILE";

export type EntityType = "SPACE" | "ASSET" | "PROFILE";

export type ActionType =
  | "CREATED"
  | "UPDATED"
  | "ARCHIVED"
  | "UPLOADED"
  | "RESTORED"
  | "FAVORITED"
  | "UNFAVORITED";

export interface DashboardUserSummary {
  firstName: string | null;
  profileImageUrl: string | null;
}

export interface DashboardSpaceSummary {
  totalSpaces: number;
  favoriteSpaces: number;
}

export interface DashboardRecentUpload {
  id: string;
  name: string;
  assetType: AssetType;
  mimeType: string | null;
  fileSize: number | null;
  spaceId: string;
  spaceName: string;
  createdAt: string;
}

export interface DashboardAssetSummary {
  totalAssets: number;
  recentUploads: DashboardRecentUpload[];
}

export interface DashboardStorageSummary {
  totalFileCount: number;
  totalBytesUsed: number;
  formattedSize: string;
}

export interface DashboardQuickStatistics {
  images: number;
  documents: number;
  videos: number;
  notes: number;
  links: number;
}

export interface DashboardSummary {
  user: DashboardUserSummary;
  spaces: DashboardSpaceSummary;
  assets: DashboardAssetSummary;
  storage: DashboardStorageSummary;
  statistics: DashboardQuickStatistics;
}

export interface RecentActivityItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface RecentSpaceItem {
  id: string;
  name: string;
  assetCount: number;
  lastActivityAt: string;
}

export interface StatisticCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  href?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface ChartDatum {
  name: string;
  value: number;
  fill?: string;
}

export interface TimeSeriesDatum {
  date: string;
  label: string;
  count: number;
}

export interface WidgetState {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}
