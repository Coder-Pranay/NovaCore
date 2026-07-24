"use client";

import {
  FavoritesSummaryWidget,
  FileStatisticsWidget,
  PinnedItemsWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  RecentAssetsWidget,
  RecentSpacesWidget,
  SharedFilesWidget,
  StatsOverviewWidget,
  StorageUsageWidget,
  UploadStatisticsWidget,
  WelcomeCardWidget,
} from "@/features/dashboard/widgets";

export function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <WelcomeCardWidget />
      <QuickActionsWidget />
      <StatsOverviewWidget />

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentAssetsWidget />
        </div>
        <RecentSpacesWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentActivityWidget />
        </div>
        <FavoritesSummaryWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <StorageUsageWidget />
        <FileStatisticsWidget />
        <UploadStatisticsWidget />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SharedFilesWidget />
        <PinnedItemsWidget />
      </div>
    </div>
  );
}
