"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  PencilIcon,
  PinIcon,
  StarIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, ROUTES } from "@/constants";
import { dashboardService } from "@/features/dashboard/api/dashboard-service";
import { SpaceColorSwatch } from "@/features/spaces/components/space-color-swatch";
import { SpaceTypeBadge } from "@/features/spaces/components/space-type-badge";
import { SpaceVisibilityBadge } from "@/features/spaces/components/space-visibility-badge";
import {
  ArchiveSpaceDialog,
  DeleteSpaceDialog,
  EditSpaceDialog,
} from "@/features/spaces/dialogs";
import {
  useArchiveSpace,
  useDeleteSpace,
  useFavoriteSpace,
  useSpace,
  useSpaceStatistics,
} from "@/features/spaces/hooks";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatDateTime, formatFileSize, formatRelativeTime, getErrorMessage, parseApiError } from "@/utils";
import { useState } from "react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card space-y-4 rounded-xl border p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const spaceId = params.id;
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canRead = hasPermission("spaces:read");
  const canWrite = hasPermission("spaces:write");

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const spaceQuery = useSpace(spaceId);
  const statsQuery = useSpaceStatistics(spaceId);
  const activityQuery = useQuery({
    queryKey: [...QUERY_KEYS.dashboard.activity, "space", spaceId],
    queryFn: async () => {
      const items = await dashboardService.getRecentActivity();
      return items.filter(
        (item) =>
          (item.entityType === "SPACE" && item.entityId === spaceId) ||
          item.title.toLowerCase().includes(spaceQuery.data?.name.toLowerCase() ?? ""),
      );
    },
    enabled: Boolean(spaceId) && Boolean(spaceQuery.data),
    staleTime: 30_000,
  });

  const favoriteMutation = useFavoriteSpace();
  const archiveMutation = useArchiveSpace();
  const deleteMutation = useDeleteSpace();

  if (!canRead) {
    return (
      <ErrorState
        title="Access denied"
        message="You need spaces:read permission to view this space."
      />
    );
  }

  if (spaceQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (spaceQuery.isError || !spaceQuery.data) {
    const parsed = parseApiError(spaceQuery.error);
    return (
      <ErrorState
        title={parsed.status === 404 ? "Space not found" : "Unable to load space"}
        message={getErrorMessage(spaceQuery.error, "This space may have been archived or deleted.")}
        action={
          <Button type="button" variant="outline" onClick={() => router.push(ROUTES.SPACES)}>
            Back to spaces
          </Button>
        }
      />
    );
  }

  const space = spaceQuery.data;
  const stats = statsQuery.data;
  const actionsDisabled =
    favoriteMutation.isPending ||
    archiveMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            onClick={() => router.push(ROUTES.SPACES)}
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to spaces
          </Button>

          <div className="flex items-start gap-3">
            <SpaceColorSwatch
              color={space.color}
              favorite={space.favorite}
              className="size-12 rounded-xl"
            />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
                {space.favorite ? (
                  <Badge variant="secondary">Favorite</Badge>
                ) : null}
                {space.archived ? (
                  <Badge variant="destructive">Archived</Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">
                {space.description || "No description provided."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <SpaceVisibilityBadge />
                <SpaceTypeBadge type={space.type} />
                <Badge variant="outline">/{space.slug}</Badge>
              </div>
            </div>
          </div>
        </div>

        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionsDisabled}
              onClick={() =>
                void favoriteMutation.mutateAsync({
                  space,
                  favorite: !space.favorite,
                })
              }
            >
              <StarIcon className="size-4" aria-hidden="true" />
              {space.favorite ? "Unfavorite" : "Favorite"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionsDisabled}
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="size-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionsDisabled}
              onClick={() => setArchiveOpen(true)}
            >
              <ArchiveIcon className="size-4" aria-hidden="true" />
              Archive
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={actionsDisabled}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Overview" description="Core space metadata">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="font-medium">
                {space.ownerId === user?.id ? "You" : space.ownerId}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Icon</dt>
              <dd className="font-medium">{space.icon || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDateTime(space.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium">{formatDateTime(space.updatedAt)}</dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Members"
          description="Sharing arrives in a later sprint"
        >
          <div className="flex items-center gap-3 rounded-lg border px-3 py-3">
            <UsersIcon className="text-muted-foreground size-5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">1 member</p>
              <p className="text-muted-foreground text-xs">
                Owner only · team invites coming with Sharing
              </p>
            </div>
          </div>
        </Section>

        <Section title="Statistics" description="Derived from assets in this space">
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : statsQuery.isError ? (
            <ErrorState
              title="Stats unavailable"
              message={getErrorMessage(statsQuery.error)}
              className="py-6"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border px-3 py-3">
                <p className="text-muted-foreground text-xs">Assets</p>
                <p className="text-2xl font-semibold">{stats?.assetCount ?? 0}</p>
              </div>
              <div className="rounded-lg border px-3 py-3">
                <p className="text-muted-foreground text-xs">Storage</p>
                <p className="text-2xl font-semibold">
                  {stats?.formattedSize ?? "0 B"}
                </p>
              </div>
            </div>
          )}
        </Section>

        <Section title="Storage summary" description="Usage for this space">
          {statsQuery.isLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total bytes</span>
                <span className="font-medium">
                  {(stats?.totalBytes ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Formatted</span>
                <span className="font-medium">{stats?.formattedSize ?? "0 B"}</span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((stats?.totalBytes ?? 0) / (5 * 1024 * 1024 * 1024)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Relative to a 5 GB personal soft cap (display only).
              </p>
            </div>
          )}
        </Section>
      </div>

      <Section title="Recent assets" description="Latest files in this space">
        {statsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !stats?.recentAssets.length ? (
          <EmptyState
            title="No assets yet"
            description="Assets management arrives in Sprint 9.5."
            className="py-8"
          />
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {stats.recentAssets.map((asset) => (
              <li
                key={asset.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{asset.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {asset.assetType} · {formatRelativeTime(asset.createdAt)}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatFileSize(asset.fileSize)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Activity" description="Recent activity related to this space">
        {activityQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !activityQuery.data?.length ? (
          <EmptyState
            title="No recent activity"
            description="Space and asset events will appear here."
            className="py-8"
          />
        ) : (
          <ul className="space-y-2">
            {activityQuery.data.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="rounded-lg border px-3 py-2.5 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="outline">{item.action}</Badge>
                </div>
                {item.description ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.description}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(item.createdAt, "MMM d, yyyy p")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Pinned assets" description="Pins are local until a dedicated Pins API exists">
        <EmptyState
          icon={PinIcon}
          title="No pins yet"
          description="Pinning from Favorites is stored locally on this device."
          className="py-8"
        />
        <p className="text-muted-foreground text-center text-xs">
          Asset browsing will expand with the full Assets module.
        </p>
      </Section>

      <EditSpaceDialog
        space={space}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ArchiveSpaceDialog
        space={space}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        isLoading={archiveMutation.isPending}
        onConfirm={() => {
          void archiveMutation.mutateAsync(space.id).then(() => {
            setArchiveOpen(false);
            router.push(ROUTES.SPACES);
          });
        }}
      />
      <DeleteSpaceDialog
        space={space}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          void deleteMutation.mutateAsync(space.id).then(() => {
            setDeleteOpen(false);
            router.push(ROUTES.SPACES);
          });
        }}
      />
    </div>
  );
}
