"use client";

import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { LazyUploadsOverTimeChart } from "@/features/dashboard/components/charts";
import { useRecentAssets } from "@/features/dashboard/hooks";
import { buildUploadsOverTime } from "@/features/dashboard/utils";
import { getErrorMessage } from "@/utils";

export function UploadStatisticsWidget() {
  const query = useRecentAssets();
  const data = buildUploadsOverTime(query.data ?? []);

  return (
    <WidgetShell
      title="Upload statistics"
      description="Recent upload volume by day"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && data.length === 0}
      emptyTitle="No uploads yet"
      emptyDescription="Upload files to track activity over time."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
    >
      <LazyUploadsOverTimeChart data={data} />
    </WidgetShell>
  );
}
