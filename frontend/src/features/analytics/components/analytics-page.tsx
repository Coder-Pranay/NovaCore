"use client";

import { useState } from "react";
import { HardDriveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LazyFileTypePieChart,
  LazyGrowthLineChart,
  LazySpaceUsageBarChart,
  LazyStorageTrendChart,
  LazyUploadTrendChart,
} from "@/features/analytics/charts";
import { useStorageAnalytics } from "@/features/analytics/hooks";
import type { AnalyticsRange } from "@/features/analytics/types";
import { ANALYTICS_RANGE_OPTIONS } from "@/features/analytics/utils";
import { AnalyticsStatCard } from "@/features/analytics/widgets/analytics-stat-card";
import { formatFileSize, formatRelativeTime, getErrorMessage, cn } from "@/utils";

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const analyticsQuery = useStorageAnalytics(range);

  const data = analyticsQuery.data;
  const summary = data?.summary;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Storage analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Usage trends derived from dashboard and assets APIs. Soft quota: 10 GB.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analytics-range">Range</Label>
          <select
            id="analytics-range"
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
            className={cn(
              "border-input bg-background flex h-9 min-w-44 rounded-lg border px-2 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
            )}
          >
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {analyticsQuery.isError ? (
        <ErrorState
          title="Unable to load analytics"
          message={getErrorMessage(analyticsQuery.error)}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void analyticsQuery.refetch()}
            >
              Retry
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsStatCard
              title="Storage used"
              value={summary?.formattedUsed ?? "—"}
              subtitle={`${summary?.usedPercent ?? 0}% of soft quota`}
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Storage remaining"
              value={summary?.formattedRemaining ?? "—"}
              subtitle="Based on 10 GB soft quota"
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="File count"
              value={summary?.fileCount ?? 0}
              subtitle={`${summary?.recentUploadCount ?? 0} recent uploads`}
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Average file size"
              value={summary?.formattedAverageFileSize ?? "—"}
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Largest file"
              value={summary?.formattedLargestFileSize ?? "—"}
              subtitle={summary?.largestFileName ?? "No files yet"}
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Largest space"
              value={summary?.formattedLargestSpaceSize ?? "—"}
              subtitle={summary?.largestSpaceName ?? "No spaces yet"}
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Growth"
              value={`${summary?.growthPercent ?? 0}%`}
              subtitle="Recent cumulative change"
              isLoading={analyticsQuery.isLoading}
            />
            <AnalyticsStatCard
              title="Quota"
              value={formatFileSize(summary?.quotaBytes ?? 0)}
              subtitle="Client soft quota placeholder"
              isLoading={analyticsQuery.isLoading}
            />
          </div>

          {!analyticsQuery.isLoading &&
          (summary?.fileCount ?? 0) === 0 &&
          (data?.largestFiles.length ?? 0) === 0 ? (
            <EmptyState
              icon={HardDriveIcon}
              title="No storage data"
              description="Upload assets to populate storage analytics."
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Storage trend" description="Cumulative bytes over time">
                  <LazyStorageTrendChart
                    data={data?.storageTrend ?? []}
                    isLoading={analyticsQuery.isLoading}
                  />
                </ChartCard>
                <ChartCard title="Growth trend" description="Line view of storage growth">
                  <LazyGrowthLineChart
                    data={data?.storageTrend ?? []}
                    isLoading={analyticsQuery.isLoading}
                  />
                </ChartCard>
                <ChartCard
                  title="Monthly upload trend"
                  description="Uploads in the selected range"
                >
                  {(data?.uploadTrend.length ?? 0) === 0 && !analyticsQuery.isLoading ? (
                    <EmptyState
                      title="No uploads"
                      description="No uploads found for this range."
                      className="py-10"
                    />
                  ) : (
                    <LazyUploadTrendChart
                      data={data?.uploadTrend ?? []}
                      isLoading={analyticsQuery.isLoading}
                    />
                  )}
                </ChartCard>
                <ChartCard
                  title="File type distribution"
                  description="Donut breakdown by asset type"
                >
                  <LazyFileTypePieChart
                    data={data?.fileTypeDistribution ?? []}
                    isLoading={analyticsQuery.isLoading}
                    donut
                  />
                </ChartCard>
                <ChartCard title="Space usage" description="Largest spaces by bytes">
                  <LazySpaceUsageBarChart
                    data={data?.largestSpaces ?? []}
                    isLoading={analyticsQuery.isLoading}
                  />
                </ChartCard>
                <ChartCard
                  title="File type (pie)"
                  description="Alternate pie visualization"
                >
                  <LazyFileTypePieChart
                    data={data?.fileTypeDistribution ?? []}
                    isLoading={analyticsQuery.isLoading}
                    donut={false}
                  />
                </ChartCard>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ListCard title="Largest files">
                  {analyticsQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : !data?.largestFiles.length ? (
                    <EmptyState title="No files" className="py-8" />
                  ) : (
                    <ul className="divide-border divide-y rounded-lg border">
                      {data.largestFiles.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {file.spaceName} · {file.assetType} ·{" "}
                              {formatRelativeTime(file.createdAt)}
                            </p>
                          </div>
                          <span className="shrink-0 font-medium">
                            {file.formattedSize}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ListCard>

                <ListCard title="Largest spaces">
                  {analyticsQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : !data?.largestSpaces.length ? (
                    <EmptyState title="No spaces" className="py-8" />
                  ) : (
                    <ul className="divide-border divide-y rounded-lg border">
                      {data.largestSpaces.map((space) => (
                        <li
                          key={space.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{space.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {space.fileCount} file
                              {space.fileCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span className="shrink-0 font-medium">
                            {space.formattedSize}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ListCard>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card space-y-3 rounded-xl border p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ListCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card space-y-3 rounded-xl border p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
