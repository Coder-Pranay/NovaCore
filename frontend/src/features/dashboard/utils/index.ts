import type {
  ChartDatum,
  DashboardQuickStatistics,
  DashboardRecentUpload,
  RecentSpaceItem,
  TimeSeriesDatum,
} from "@/features/dashboard/types";
import { formatDate } from "@/utils/date";

/** Soft quota used to compute storage remaining until Sprint 5.7 analytics. */
export const DEFAULT_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;

export function buildAssetDistribution(
  statistics: DashboardQuickStatistics,
): ChartDatum[] {
  return [
    { name: "Images", value: statistics.images, fill: "var(--chart-1)" },
    { name: "Documents", value: statistics.documents, fill: "var(--chart-2)" },
    { name: "Videos", value: statistics.videos, fill: "var(--chart-3)" },
    { name: "Notes", value: statistics.notes, fill: "var(--chart-4)" },
    { name: "Links", value: statistics.links, fill: "var(--chart-5)" },
  ].filter((item) => item.value > 0);
}

export function buildUploadsOverTime(
  uploads: DashboardRecentUpload[],
): TimeSeriesDatum[] {
  const buckets = new Map<string, number>();

  for (const upload of uploads) {
    const date = upload.createdAt.slice(0, 10);
    buckets.set(date, (buckets.get(date) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      label: formatDate(date, "MMM d") || date,
      count,
    }));
}

export function deriveRecentSpaces(
  uploads: DashboardRecentUpload[],
): RecentSpaceItem[] {
  const bySpace = new Map<string, RecentSpaceItem>();

  for (const upload of uploads) {
    const existing = bySpace.get(upload.spaceId);

    if (!existing) {
      bySpace.set(upload.spaceId, {
        id: upload.spaceId,
        name: upload.spaceName,
        assetCount: 1,
        lastActivityAt: upload.createdAt,
      });
      continue;
    }

    existing.assetCount += 1;
    if (upload.createdAt > existing.lastActivityAt) {
      existing.lastActivityAt = upload.createdAt;
    }
  }

  return Array.from(bySpace.values()).sort((a, b) =>
    b.lastActivityAt.localeCompare(a.lastActivityAt),
  );
}

export function storageRemainingBytes(
  totalBytesUsed: number,
  quotaBytes = DEFAULT_STORAGE_QUOTA_BYTES,
): number {
  return Math.max(quotaBytes - totalBytesUsed, 0);
}

export function storageUsagePercent(
  totalBytesUsed: number,
  quotaBytes = DEFAULT_STORAGE_QUOTA_BYTES,
): number {
  if (quotaBytes <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((totalBytesUsed / quotaBytes) * 100));
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) {
    return "NC";
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export { PRIMARY_NAV } from "./navigation";
export type { NavItem } from "./navigation";
