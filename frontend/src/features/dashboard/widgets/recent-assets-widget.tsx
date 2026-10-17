"use client";

import Link from "next/link";
import { FileIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { useRecentAssets } from "@/features/dashboard/hooks";
import { cn } from "@/utils";
import { formatRelativeTime } from "@/utils/date";
import { formatFileSize } from "@/utils/file-size";
import { getErrorMessage } from "@/utils";

export function RecentAssetsWidget() {
  const query = useRecentAssets();
  const assets = query.data ?? [];

  return (
    <WidgetShell
      title="Recent assets"
      description="Latest uploads across your spaces"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && assets.length === 0}
      emptyTitle="No assets yet"
      emptyDescription="Upload your first file to see it appear here."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
      action={
        <Link
          href={ROUTES.ASSETS}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View all
        </Link>
      }
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      }
    >
      <ul className="divide-border divide-y">
        {assets.slice(0, 6).map((asset) => (
          <li key={asset.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
              <FileIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{asset.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {asset.spaceName}
                {asset.fileSize != null ? ` · ${formatFileSize(asset.fileSize)}` : ""}
                {" · "}
                {formatRelativeTime(asset.createdAt)}
              </p>
            </div>
            <Badge variant="secondary">{asset.assetType}</Badge>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}
