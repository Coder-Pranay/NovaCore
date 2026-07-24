"use client";

import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { categoryLabel } from "@/features/notifications/utils";
import { formatRelativeTime, cn } from "@/utils";

export function NotificationBell() {
  const router = useRouter();
  const unreadQuery = useUnreadCount();
  const previewQuery = useNotifications({
    status: "ALL",
    page: 0,
    size: 5,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unread = unreadQuery.data ?? 0;
  const items = previewQuery.data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative",
        )}
      >
        <BellIcon className="size-4" />
        {unread > 0 ? (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-96" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-normal"
            disabled={markAllRead.isPending || unread === 0}
            onClick={() => void markAllRead.mutateAsync()}
          >
            <CheckCheckIcon className="size-3.5" />
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {previewQuery.isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            No notifications yet
          </p>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex flex-col items-start gap-1 py-2"
              onClick={() => {
                if (item.status === "UNREAD") {
                  void markRead.mutateAsync(item.id);
                }
                if (item.href) {
                  router.push(item.href);
                }
              }}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                {item.status === "UNREAD" ? (
                  <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />
                ) : null}
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {item.body}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {categoryLabel(item.category)} ·{" "}
                {formatRelativeTime(item.createdAt)}
              </p>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center"
          onClick={() => router.push(ROUTES.NOTIFICATIONS)}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
