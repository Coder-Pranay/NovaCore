"use client";

import {
  FilesIcon,
  FolderIcon,
  HardDriveIcon,
  HeartIcon,
  Share2Icon,
  UploadIcon,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useDashboard, useStorageSummary } from "@/features/dashboard/hooks";
import { formatFileSize } from "@/utils/file-size";
import {
  DEFAULT_STORAGE_QUOTA_BYTES,
  storageRemainingBytes,
} from "@/features/dashboard/utils";

export function StatsOverviewWidget() {
  const dashboard = useDashboard();
  const storage = useStorageSummary();

  const isLoading = dashboard.isLoading || storage.isLoading;
  const isError = dashboard.isError;
  const retry = () => {
    void dashboard.refetch();
    void storage.refetch();
  };

  const summary = dashboard.data;
  const remaining = storage.data?.remainingBytes
    ?? storageRemainingBytes(summary?.storage.totalBytesUsed ?? 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Spaces"
        value={summary?.spaces.totalSpaces ?? 0}
        subtitle="Active Life Spaces"
        icon={FolderIcon}
        href={ROUTES.SPACES}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Total Assets"
        value={summary?.assets.totalAssets ?? 0}
        subtitle="Files across your spaces"
        icon={FilesIcon}
        href={ROUTES.ASSETS}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Favorites"
        value={summary?.spaces.favoriteSpaces ?? 0}
        subtitle="Favorite spaces"
        icon={HeartIcon}
        href={ROUTES.FAVORITES}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Shared Files"
        value={0}
        subtitle="Coming in Sharing sprint"
        icon={Share2Icon}
        href={ROUTES.SHARED}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Storage Used"
        value={summary?.storage.formattedSize ?? "0 B"}
        subtitle={`${summary?.storage.totalFileCount ?? 0} files`}
        icon={HardDriveIcon}
        href={ROUTES.STORAGE}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Storage Remaining"
        value={storage.data?.formattedRemaining ?? formatFileSize(remaining)}
        subtitle={`of ${formatFileSize(DEFAULT_STORAGE_QUOTA_BYTES)} quota`}
        icon={HardDriveIcon}
        href={ROUTES.STORAGE}
        isLoading={isLoading}
        isError={Boolean(storage.isError)}
        onRetry={() => void storage.refetch()}
      />
      <StatCard
        title="Recent Uploads"
        value={summary?.assets.recentUploads.length ?? 0}
        subtitle="Latest file activity"
        icon={UploadIcon}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <StatCard
        title="Documents"
        value={summary?.statistics.documents ?? 0}
        subtitle="PDFs and documents"
        icon={FilesIcon}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
        trend={
          isError
            ? undefined
            : {
                value: 0,
                direction: "neutral",
                label: "vs last week",
              }
        }
      />
    </div>
  );
}
