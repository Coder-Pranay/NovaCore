export type AnalyticsRange =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "year"
  | "custom";

export interface AnalyticsAsset {
  id: string;
  name: string;
  spaceId: string;
  assetType: string;
  fileSize: number | null;
  createdAt: string;
}

export interface AnalyticsSpace {
  id: string;
  name: string;
}

export interface StorageAnalyticsSummary {
  totalBytesUsed: number;
  remainingBytes: number;
  quotaBytes: number;
  usedPercent: number;
  formattedUsed: string;
  formattedRemaining: string;
  fileCount: number;
  averageFileSize: number;
  formattedAverageFileSize: string;
  largestFileName: string | null;
  largestFileSize: number;
  formattedLargestFileSize: string;
  largestSpaceName: string | null;
  largestSpaceBytes: number;
  formattedLargestSpaceSize: string;
  growthPercent: number;
  recentUploadCount: number;
}

export interface StorageTrendPoint {
  date: string;
  label: string;
  bytes: number;
  formattedBytes: string;
}

export interface UploadTrendPoint {
  date: string;
  label: string;
  count: number;
  bytes: number;
}

export interface LargestFileItem {
  id: string;
  name: string;
  spaceId: string;
  spaceName: string;
  assetType: string;
  fileSize: number;
  formattedSize: string;
  createdAt: string;
}

export interface LargestSpaceItem {
  id: string;
  name: string;
  fileCount: number;
  totalBytes: number;
  formattedSize: string;
}

export interface FileTypeDatum {
  name: string;
  value: number;
  fill?: string;
}

export interface AnalyticsDashboardData {
  summary: StorageAnalyticsSummary;
  storageTrend: StorageTrendPoint[];
  uploadTrend: UploadTrendPoint[];
  fileTypeDistribution: FileTypeDatum[];
  largestFiles: LargestFileItem[];
  largestSpaces: LargestSpaceItem[];
  range: AnalyticsRange;
}
