"use client";

import Link from "next/link";
import { FolderIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { useRecentSpaces } from "@/features/dashboard/hooks";
import { formatRelativeTime } from "@/utils/date";
import { getErrorMessage } from "@/utils";

export function RecentSpacesWidget() {
  const query = useRecentSpaces();
  const spaces = query.data ?? [];

  return (
    <WidgetShell
      title="Recent spaces"
      description="Spaces with the latest file activity"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && spaces.length === 0}
      emptyTitle="No spaces yet"
      emptyDescription="Create a Life Space to start organizing assets."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
      action={
        <Link
          href={ROUTES.SPACES}
          className="border-border hover:bg-muted inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium"
        >
          View all
        </Link>
      }
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      }
    >
      <ul className="space-y-2">
        {spaces.slice(0, 5).map((space) => (
          <li key={space.id}>
            <Link
              href={ROUTES.SPACES}
              className="hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-lg border p-3 transition-colors outline-none focus-visible:ring-2"
            >
              <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                <FolderIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{space.name}</p>
                <p className="text-muted-foreground text-xs">
                  {space.assetCount} recent file{space.assetCount === 1 ? "" : "s"} ·{" "}
                  {formatRelativeTime(space.lastActivityAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}
