"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCheckIcon,
  SearchIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationDetailDrawer } from "@/features/notifications/components/notification-detail-drawer";
import { NotificationPreferencesDialog } from "@/features/notifications/dialogs/notification-preferences-dialog";
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/features/notifications/hooks";
import type {
  AppNotification,
  NotificationCategory,
  NotificationListParams,
  NotificationStatus,
} from "@/features/notifications/types";
import { NOTIFICATION_CATEGORIES } from "@/features/notifications/types";
import {
  categoryLabel,
  groupNotificationsByDate,
} from "@/features/notifications/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRelativeTime, getErrorMessage, cn } from "@/utils";

export function NotificationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<NotificationListParams>({
    status: "ALL",
    category: "ALL",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 20,
  });
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const listParams = useMemo(
    () => ({ ...filters, q: debouncedSearch }),
    [debouncedSearch, filters],
  );

  const notificationsQuery = useNotifications(listParams);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteMutation = useDeleteNotification();

  const result = notificationsQuery.data;
  const items = result?.items ?? [];
  const groups = groupNotificationsByDate(items);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !result?.hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !notificationsQuery.isFetching) {
          setFilters((current) => ({
            ...current,
            size: Math.min((current.size ?? 20) + 20, 100),
          }));
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [result?.hasMore, notificationsQuery.isFetching]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Activity updates, alerts, and system messages.
            {result ? ` ${result.unreadCount} unread.` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => void markAllRead.mutateAsync()}
          >
            <CheckCheckIcon className="size-4" />
            Mark all read
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreferencesOpen(true)}
          >
            <SettingsIcon className="size-4" />
            Preferences
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="notifications-search" className="sr-only">
            Search notifications
          </Label>
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="notifications-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setFilters((current) => ({ ...current, page: 0, size: 20 }));
            }}
            placeholder="Search notifications..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <FilterSelect
            id="notif-status"
            label="Status"
            value={filters.status ?? "ALL"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as NotificationStatus | "ALL",
                page: 0,
                size: 20,
              }))
            }
            options={[
              { value: "ALL", label: "All" },
              { value: "UNREAD", label: "Unread" },
              { value: "READ", label: "Read" },
            ]}
          />
          <FilterSelect
            id="notif-category"
            label="Category"
            value={filters.category ?? "ALL"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                category: value as NotificationCategory | "ALL",
                page: 0,
                size: 20,
              }))
            }
            options={[
              { value: "ALL", label: "All categories" },
              ...NOTIFICATION_CATEGORIES.map((category) => ({
                value: category,
                label: categoryLabel(category),
              })),
            ]}
          />
          <FilterSelect
            id="notif-sort"
            label="Sort"
            value={`${filters.sortBy ?? "createdAt"}:${filters.sortDir ?? "desc"}`}
            onChange={(value) => {
              const [sortBy, sortDir] = value.split(":") as [
                NotificationListParams["sortBy"],
                NotificationListParams["sortDir"],
              ];
              setFilters((current) => ({
                ...current,
                sortBy,
                sortDir,
                page: 0,
                size: 20,
              }));
            }}
            options={[
              { value: "createdAt:desc", label: "Newest" },
              { value: "createdAt:asc", label: "Oldest" },
              { value: "title:asc", label: "Title A–Z" },
              { value: "category:asc", label: "Category" },
            ]}
          />
        </div>
      </div>

      {notificationsQuery.isError ? (
        <ErrorState
          title="Unable to load notifications"
          message={getErrorMessage(notificationsQuery.error)}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void notificationsQuery.refetch()}
            >
              Retry
            </Button>
          }
        />
      ) : notificationsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="No notifications"
          description={
            debouncedSearch.trim()
              ? "No notifications matched your search."
              : "You are all caught up."
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {group.label}
              </h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <article
                      className={cn(
                        "bg-card hover:bg-muted/40 flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors sm:flex-row sm:items-start sm:justify-between",
                        item.status === "UNREAD" && "border-primary/30",
                      )}
                      onClick={() => {
                        setSelected(item);
                        if (item.status === "UNREAD") {
                          void markRead.mutateAsync(item.id);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(item);
                          if (item.status === "UNREAD") {
                            void markRead.mutateAsync(item.id);
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.title}. ${item.status === "UNREAD" ? "Unread" : "Read"}`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{item.title}</h3>
                          {item.status === "UNREAD" ? (
                            <Badge variant="default">Unread</Badge>
                          ) : (
                            <Badge variant="outline">Read</Badge>
                          )}
                          <Badge variant="secondary">
                            {categoryLabel(item.category)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {item.body}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {item.href ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(item.href!);
                            }}
                          >
                            Open
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete ${item.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteMutation.mutateAsync(item.id);
                          }}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
          {notificationsQuery.isFetching ? (
            <p className="text-muted-foreground text-center text-sm">Loading more…</p>
          ) : null}
        </div>
      )}

      <NotificationDetailDrawer
        notification={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onDelete={(id) => {
          void deleteMutation.mutateAsync(id).then(() => setSelected(null));
        }}
      />

      <NotificationPreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "border-input bg-background flex h-9 w-full rounded-lg border px-2 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
