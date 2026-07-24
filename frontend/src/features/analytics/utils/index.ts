import {
  DEFAULT_STORAGE_QUOTA_BYTES,
  storageRemainingBytes,
  storageUsagePercent,
} from "@/features/dashboard/utils";
import type { DashboardSummary } from "@/features/dashboard/types";
import type {
  AnalyticsAsset,
  AnalyticsDashboardData,
  AnalyticsRange,
  AnalyticsSpace,
  FileTypeDatum,
  LargestFileItem,
  LargestSpaceItem,
  StorageTrendPoint,
  UploadTrendPoint,
} from "@/features/analytics/types";
import { formatDate, formatFileSize } from "@/utils";

export function rangeToDays(range: AnalyticsRange): number | null {
  switch (range) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "year":
      return 365;
    case "custom":
      return 30;
    default:
      return 30;
  }
}

export function filterAssetsByRange(
  assets: AnalyticsAsset[],
  range: AnalyticsRange,
): AnalyticsAsset[] {
  const days = rangeToDays(range);
  if (!days) {
    return assets;
  }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return assets.filter((asset) => new Date(asset.createdAt).getTime() >= cutoff);
}

export function buildLargestFiles(
  assets: AnalyticsAsset[],
  spaces: AnalyticsSpace[],
  limit = 8,
): LargestFileItem[] {
  const spaceNames = new Map(spaces.map((space) => [space.id, space.name]));

  return [...assets]
    .filter((asset) => (asset.fileSize ?? 0) > 0)
    .sort((a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0))
    .slice(0, limit)
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      spaceId: asset.spaceId,
      spaceName: spaceNames.get(asset.spaceId) ?? "Unknown space",
      assetType: asset.assetType,
      fileSize: asset.fileSize ?? 0,
      formattedSize: formatFileSize(asset.fileSize),
      createdAt: asset.createdAt,
    }));
}

export function buildLargestSpaces(
  assets: AnalyticsAsset[],
  spaces: AnalyticsSpace[],
  limit = 8,
): LargestSpaceItem[] {
  const bySpace = new Map<string, { fileCount: number; totalBytes: number }>();

  for (const asset of assets) {
    const current = bySpace.get(asset.spaceId) ?? {
      fileCount: 0,
      totalBytes: 0,
    };
    current.fileCount += 1;
    current.totalBytes += asset.fileSize ?? 0;
    bySpace.set(asset.spaceId, current);
  }

  return spaces
    .map((space) => {
      const stats = bySpace.get(space.id) ?? { fileCount: 0, totalBytes: 0 };
      return {
        id: space.id,
        name: space.name,
        fileCount: stats.fileCount,
        totalBytes: stats.totalBytes,
        formattedSize: formatFileSize(stats.totalBytes),
      };
    })
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .slice(0, limit);
}

export function buildUploadTrend(assets: AnalyticsAsset[]): UploadTrendPoint[] {
  const buckets = new Map<string, { count: number; bytes: number }>();

  for (const asset of assets) {
    const date = asset.createdAt.slice(0, 10);
    const current = buckets.get(date) ?? { count: 0, bytes: 0 };
    current.count += 1;
    current.bytes += asset.fileSize ?? 0;
    buckets.set(date, current);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: formatDate(date, "MMM d") || date,
      count: value.count,
      bytes: value.bytes,
    }));
}

export function buildStorageTrend(assets: AnalyticsAsset[]): StorageTrendPoint[] {
  const sorted = [...assets].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const byDate = new Map<string, number>();
  let running = 0;

  for (const asset of sorted) {
    running += asset.fileSize ?? 0;
    byDate.set(asset.createdAt.slice(0, 10), running);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bytes]) => ({
      date,
      label: formatDate(date, "MMM d") || date,
      bytes,
      formattedBytes: formatFileSize(bytes),
    }));
}

export function buildFileTypeDistribution(
  summary: DashboardSummary,
  assets: AnalyticsAsset[],
): FileTypeDatum[] {
  if (
    summary.statistics.images +
      summary.statistics.documents +
      summary.statistics.videos +
      summary.statistics.notes +
      summary.statistics.links >
    0
  ) {
    return [
      { name: "Images", value: summary.statistics.images, fill: "var(--chart-1)" },
      {
        name: "Documents",
        value: summary.statistics.documents,
        fill: "var(--chart-2)",
      },
      { name: "Videos", value: summary.statistics.videos, fill: "var(--chart-3)" },
      { name: "Notes", value: summary.statistics.notes, fill: "var(--chart-4)" },
      { name: "Links", value: summary.statistics.links, fill: "var(--chart-5)" },
    ].filter((item) => item.value > 0);
  }

  const counts = new Map<string, number>();
  for (const asset of assets) {
    counts.set(asset.assetType, (counts.get(asset.assetType) ?? 0) + 1);
  }

  const fills = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return Array.from(counts.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: fills[index % fills.length],
  }));
}

export function buildAnalyticsDashboard(
  summary: DashboardSummary,
  assets: AnalyticsAsset[],
  spaces: AnalyticsSpace[],
  range: AnalyticsRange,
): AnalyticsDashboardData {
  const rangedAssets = filterAssetsByRange(assets, range);
  const sizedAssets = assets.filter((asset) => (asset.fileSize ?? 0) > 0);
  const totalBytes = summary.storage.totalBytesUsed;
  const remaining = storageRemainingBytes(totalBytes);
  const usedPercent = storageUsagePercent(totalBytes);
  const averageFileSize =
    sizedAssets.length > 0
      ? Math.round(totalBytes / sizedAssets.length)
      : 0;

  const largestFiles = buildLargestFiles(assets, spaces);
  const largestSpaces = buildLargestSpaces(assets, spaces);
  const storageTrend = buildStorageTrend(assets);
  const uploadTrend = buildUploadTrend(rangedAssets);

  const previousHalf = storageTrend[Math.max(storageTrend.length - 2, 0)];
  const latest = storageTrend[storageTrend.length - 1];
  const growthPercent =
    previousHalf && previousHalf.bytes > 0 && latest
      ? Math.round(((latest.bytes - previousHalf.bytes) / previousHalf.bytes) * 100)
      : 0;

  return {
    range,
    summary: {
      totalBytesUsed: totalBytes,
      remainingBytes: remaining,
      quotaBytes: DEFAULT_STORAGE_QUOTA_BYTES,
      usedPercent,
      formattedUsed: summary.storage.formattedSize,
      formattedRemaining: formatFileSize(remaining),
      fileCount: summary.storage.totalFileCount,
      averageFileSize,
      formattedAverageFileSize: formatFileSize(averageFileSize),
      largestFileName: largestFiles[0]?.name ?? null,
      largestFileSize: largestFiles[0]?.fileSize ?? 0,
      formattedLargestFileSize: largestFiles[0]?.formattedSize ?? "0 B",
      largestSpaceName: largestSpaces[0]?.name ?? null,
      largestSpaceBytes: largestSpaces[0]?.totalBytes ?? 0,
      formattedLargestSpaceSize: largestSpaces[0]?.formattedSize ?? "0 B",
      growthPercent,
      recentUploadCount: summary.assets.recentUploads.length,
    },
    storageTrend,
    uploadTrend,
    fileTypeDistribution: buildFileTypeDistribution(summary, assets),
    largestFiles,
    largestSpaces,
  };
}

export const ANALYTICS_RANGE_OPTIONS: Array<{
  value: AnalyticsRange;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom (placeholder)" },
];
