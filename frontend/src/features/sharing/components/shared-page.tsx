"use client";

import { useMemo, useState } from "react";
import {
  ClockIcon,
  InboxIcon,
  LinkIcon,
  SearchIcon,
  Share2Icon,
  SendIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareDialog } from "@/features/sharing/dialogs";
import {
  useCopyShareLink,
  useDisablePublicLink,
  useRemoveAccess,
  useSharedItems,
} from "@/features/sharing/hooks";
import { PermissionBadge } from "@/features/sharing/permissions";
import type {
  ShareResource,
  SharedAccess,
  SharedListParams,
} from "@/features/sharing/types";
import { statusLabel } from "@/features/sharing/utils";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate, formatRelativeTime, getErrorMessage, cn } from "@/utils";

export function SharedPage() {
  const { hasPermission } = useAuth();
  const canRead =
    hasPermission("sharing:read") ||
    hasPermission("spaces:read") ||
    hasPermission("assets:read");
  const canWrite =
    hasPermission("sharing:write") ||
    hasPermission("spaces:write") ||
    hasPermission("assets:write");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<SharedListParams>({
    direction: "ALL",
    status: "ALL",
    permission: "ALL",
    visibility: "ALL",
    resourceType: "ALL",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 20,
  });
  const [shareResource, setShareResource] = useState<ShareResource | null>(null);
  const [tab, setTab] = useState<
    "all" | "incoming" | "outgoing" | "pending" | "expired" | "links"
  >("all");

  const listParams = useMemo(() => {
    const base: SharedListParams = {
      ...filters,
      q: debouncedSearch,
    };
    if (tab === "incoming") base.direction = "INCOMING";
    if (tab === "outgoing") base.direction = "OUTGOING";
    if (tab === "pending") base.status = "PENDING";
    if (tab === "expired") base.status = "EXPIRED";
    if (tab === "links") base.visibility = "PUBLIC";
    return base;
  }, [debouncedSearch, filters, tab]);

  const sharedQuery = useSharedItems(listParams);
  const removeAccessMutation = useRemoveAccess();
  const disableLinkMutation = useDisablePublicLink();
  const copyLinkMutation = useCopyShareLink();

  const result = sharedQuery.data;
  const items = result?.items ?? [];
  const publicLinks = result?.publicLinks ?? [];

  if (!canRead) {
    return (
      <ErrorState
        title="Access denied"
        message="You need sharing:read permission to view shared items."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Shared</h1>
        <p className="text-muted-foreground text-sm">
          Incoming and outgoing shares, invitations, and public links.
        </p>
      </div>

      {sharedQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : result ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Incoming" value={result.incoming.length} icon={<InboxIcon className="size-4" />} />
          <StatCard title="Outgoing" value={result.outgoing.length} icon={<SendIcon className="size-4" />} />
          <StatCard title="Pending" value={result.pending.length} icon={<ClockIcon className="size-4" />} />
          <StatCard title="Expired" value={result.expired.length} icon={<ClockIcon className="size-4" />} />
          <StatCard title="Public links" value={result.publicLinks.length} icon={<LinkIcon className="size-4" />} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["incoming", "Incoming"],
            ["outgoing", "Outgoing"],
            ["pending", "Pending"],
            ["expired", "Expired"],
            ["links", "Public links"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={tab === id ? "default" : "outline"}
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              setFilters((current) => ({ ...current, page: 0 }));
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="shared-search" className="sr-only">
            Search shared items
          </Label>
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="shared-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setFilters((current) => ({ ...current, page: 0 }));
            }}
            placeholder="Search shared items..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <FilterSelect
            id="shared-permission"
            label="Permission"
            value={filters.permission ?? "ALL"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                permission: value as SharedListParams["permission"],
                page: 0,
              }))
            }
            options={[
              { value: "ALL", label: "All permissions" },
              { value: "VIEWER", label: "Viewer" },
              { value: "COMMENTER", label: "Commenter" },
              { value: "EDITOR", label: "Editor" },
              { value: "OWNER", label: "Owner" },
            ]}
          />
          <FilterSelect
            id="shared-type"
            label="Type"
            value={filters.resourceType ?? "ALL"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                resourceType: value as SharedListParams["resourceType"],
                page: 0,
              }))
            }
            options={[
              { value: "ALL", label: "Spaces & assets" },
              { value: "SPACE", label: "Spaces" },
              { value: "ASSET", label: "Assets" },
            ]}
          />
          <FilterSelect
            id="shared-visibility"
            label="Visibility"
            value={filters.visibility ?? "ALL"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                visibility: value as SharedListParams["visibility"],
                page: 0,
              }))
            }
            options={[
              { value: "ALL", label: "All" },
              { value: "PRIVATE", label: "Private" },
              { value: "PUBLIC", label: "Public" },
            ]}
          />
          <FilterSelect
            id="shared-sort"
            label="Sort"
            value={filters.sortBy ?? "createdAt"}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                sortBy: value as SharedListParams["sortBy"],
                page: 0,
              }))
            }
            options={[
              { value: "createdAt", label: "Recently shared" },
              { value: "name", label: "Alphabetical" },
              { value: "permission", label: "Permission" },
              { value: "expiresAt", label: "Expiration" },
            ]}
          />
        </div>
      </div>

      {sharedQuery.isError ? (
        <ErrorState
          title="Unable to load shared items"
          message={getErrorMessage(sharedQuery.error)}
          action={
            <Button type="button" variant="outline" onClick={() => void sharedQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : tab === "links" ? (
        publicLinks.length === 0 && !sharedQuery.isLoading ? (
          <EmptyState
            icon={LinkIcon}
            title="No public links"
            description="Generate a public link from the share dialog."
          />
        ) : (
          <ul className="space-y-3">
            {sharedQuery.isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))
              : publicLinks.map((link) => (
                  <li
                    key={link.id}
                    className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{link.resourceName}</p>
                      <p className="text-muted-foreground truncate text-sm">{link.url}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{link.resourceType}</Badge>
                        <Badge variant={link.enabled ? "secondary" : "destructive"}>
                          {link.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void copyLinkMutation.mutateAsync(link.url)}
                      >
                        Copy link
                      </Button>
                      {canWrite && link.enabled ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={disableLinkMutation.isPending}
                          onClick={() =>
                            void disableLinkMutation.mutateAsync({ linkId: link.id })
                          }
                        >
                          Disable
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setShareResource({
                            resourceType: link.resourceType,
                            resourceId: link.resourceId,
                            resourceName: link.resourceName,
                          })
                        }
                      >
                        Manage
                      </Button>
                    </div>
                  </li>
                ))}
          </ul>
        )
      ) : items.length === 0 && !sharedQuery.isLoading ? (
        debouncedSearch.trim() ? (
          <EmptyState
            icon={SearchIcon}
            title="No search results"
            description={`Nothing matched “${debouncedSearch.trim()}”.`}
          />
        ) : tab === "pending" ? (
          <EmptyState
            icon={ClockIcon}
            title="No invitations"
            description="Pending invitations will appear here."
          />
        ) : (
          <EmptyState
            icon={Share2Icon}
            title="No shared items"
            description="Share a space or asset from Favorites to get started."
          />
        )
      ) : (
        <div className="space-y-3">
          {sharedQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-xl" />
              ))
            : items.map((share) => (
                <ShareRow
                  key={share.id}
                  share={share}
                  canWrite={canWrite}
                  disabled={removeAccessMutation.isPending}
                  onManage={() =>
                    setShareResource({
                      resourceType: share.resourceType,
                      resourceId: share.resourceId,
                      resourceName: share.resourceName,
                    })
                  }
                  onRemove={() =>
                    void removeAccessMutation.mutateAsync({ shareId: share.id })
                  }
                />
              ))}

          {result && result.total > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                Showing {result.page * result.size + 1}–
                {Math.min((result.page + 1) * result.size, result.total)} of{" "}
                {result.total}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={result.page <= 0}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: (current.page ?? 0) - 1,
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={result.page + 1 >= result.totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: (current.page ?? 0) + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ShareDialog
        resource={shareResource}
        open={Boolean(shareResource)}
        onOpenChange={(open) => {
          if (!open) setShareResource(null);
        }}
      />
    </div>
  );
}

function ShareRow({
  share,
  canWrite,
  disabled,
  onManage,
  onRemove,
}: {
  share: SharedAccess;
  canWrite: boolean;
  disabled: boolean;
  onManage: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-medium">{share.resourceName}</h2>
          <Badge variant="outline">{share.resourceType}</Badge>
          <Badge variant="secondary">{statusLabel(share.status)}</Badge>
          <PermissionBadge permission={share.permission} />
        </div>
        <p className="text-muted-foreground text-sm">
          {share.direction === "OUTGOING" ? "Shared with" : "Shared by"}{" "}
          <span className="text-foreground">{share.email}</span>
          {" · "}
          {formatRelativeTime(share.createdAt)}
          {share.expiresAt
            ? ` · expires ${formatDate(share.expiresAt, "MMM d, yyyy")}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onManage}>
          Manage access
        </Button>
        {canWrite && share.status !== "REVOKED" ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={onRemove}
          >
            Remove access
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
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
