"use client";

import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { LazyAssetDistributionChart } from "@/features/dashboard/components/charts";
import { useDashboard } from "@/features/dashboard/hooks";
import { buildAssetDistribution } from "@/features/dashboard/utils";
import { getErrorMessage, cn } from "@/utils";

export function FileStatisticsWidget() {
  const query = useDashboard();
  const data = query.data ? buildAssetDistribution(query.data.statistics) : [];

  return (
    <WidgetShell
      title="File statistics"
      description="Asset distribution by type"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && data.length === 0}
      emptyTitle="No file statistics"
      emptyDescription="Upload assets to see type distribution."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
    >
      <LazyAssetDistributionChart data={data} />
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {data.map((item) => (
          <li key={item.name} className="text-muted-foreground flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 rounded-full",
                item.name === "Images" && "bg-[var(--chart-1)]",
                item.name === "Documents" && "bg-[var(--chart-2)]",
                item.name === "Videos" && "bg-[var(--chart-3)]",
                item.name === "Notes" && "bg-[var(--chart-4)]",
                item.name === "Links" && "bg-[var(--chart-5)]",
              )}
              aria-hidden="true"
            />
            {item.name}: {item.value}
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}
