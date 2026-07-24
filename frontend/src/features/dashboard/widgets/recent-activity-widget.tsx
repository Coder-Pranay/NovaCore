"use client";

import {
  ArchiveIcon,
  FilePlusIcon,
  HeartIcon,
  PencilIcon,
  RotateCcwIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { useRecentActivity } from "@/features/dashboard/hooks";
import type { ActionType, EntityType } from "@/features/dashboard/types";
import { formatRelativeTime } from "@/utils/date";
import { getErrorMessage } from "@/utils";

function activityIcon(action: ActionType, entityType: EntityType) {
  if (entityType === "PROFILE") {
    return UserIcon;
  }

  switch (action) {
    case "UPLOADED":
      return UploadIcon;
    case "CREATED":
      return FilePlusIcon;
    case "UPDATED":
      return PencilIcon;
    case "ARCHIVED":
      return ArchiveIcon;
    case "RESTORED":
      return RotateCcwIcon;
    case "FAVORITED":
    case "UNFAVORITED":
      return HeartIcon;
    default:
      return FilePlusIcon;
  }
}

export function RecentActivityWidget() {
  const query = useRecentActivity();
  const items = query.data ?? [];

  return (
    <WidgetShell
      title="Recent activity"
      description="Your latest actions across NovaCore"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && items.length === 0}
      emptyTitle="No activity yet"
      emptyDescription="Actions like creating spaces or uploading files will appear here."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
      skeleton={
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      }
    >
      <ul className="space-y-4" aria-label="Activity timeline">
        {items.slice(0, 8).map((item) => {
          const Icon = activityIcon(item.action, item.entityType);

          return (
            <li key={item.id} className="flex items-start gap-3">
              <Avatar className="size-9">
                <AvatarFallback>
                  <Icon className="size-4" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description ? (
                  <p className="text-muted-foreground truncate text-xs">{item.description}</p>
                ) : null}
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}
