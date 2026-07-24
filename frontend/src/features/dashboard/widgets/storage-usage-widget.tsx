"use client";

import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { LazyStorageUsageChart } from "@/features/dashboard/components/charts";
import { useStorageSummary } from "@/features/dashboard/hooks";
import {
  storageUsagePercent,
  DEFAULT_STORAGE_QUOTA_BYTES,
} from "@/features/dashboard/utils";
import { formatFileSize } from "@/utils/file-size";
import { getErrorMessage } from "@/utils";

export function StorageUsageWidget() {
  const query = useStorageSummary();
  const used = query.data?.totalBytesUsed ?? 0;
  const remaining = query.data?.remainingBytes ?? 0;
  const percent = storageUsagePercent(used);

  return (
    <WidgetShell
      title="Storage usage"
      description={`Quota ${formatFileSize(DEFAULT_STORAGE_QUOTA_BYTES)}`}
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && used === 0}
      emptyTitle="No storage used"
      emptyDescription="Uploaded files will count toward your storage quota."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
    >
      <LazyStorageUsageChart
        usedPercent={percent}
        usedLabel={query.data?.formattedSize ?? formatFileSize(used)}
        remainingLabel={query.data?.formattedRemaining ?? formatFileSize(remaining)}
      />
    </WidgetShell>
  );
}
