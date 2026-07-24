"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RowSelectionState } from "@tanstack/react-table";
import { FolderIcon, HeartIcon, SearchIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { FavoritesBulkActions } from "@/features/favorites/components/favorites-bulk-actions";
import { FavoritesCards } from "@/features/favorites/components/favorites-cards";
import { FavoritesPagination } from "@/features/favorites/components/favorites-pagination";
import { FavoritesToolbar } from "@/features/favorites/components/favorites-toolbar";
import {
  useBulkFavorite,
  useFavorites,
  useToggleFavorite,
  useToggleFavoritePin,
} from "@/features/favorites/hooks";
import { FavoritesTable } from "@/features/favorites/tables/favorites-table";
import type { FavoriteItem, FavoriteListParams } from "@/features/favorites/types";
import { ShareDialog } from "@/features/sharing/dialogs/share-dialog";
import type { ShareResource } from "@/features/sharing/types";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { getErrorMessage, parseApiError } from "@/utils";

function errorTitleForStatus(status?: number): string {
  switch (status) {
    case 401:
      return "Authentication required";
    case 403:
      return "Access denied";
    case 404:
      return "Not found";
    case 409:
      return "Conflict";
    case 422:
      return "Invalid request";
    case 429:
      return "Too many requests";
    case 500:
      return "Server error";
    default:
      return "Unable to load favorites";
  }
}

function toShareResource(item: FavoriteItem): ShareResource {
  return {
    resourceType: item.entityType,
    resourceId: item.entityId,
    resourceName: item.name,
  };
}

function toUnfavoriteTarget(item: FavoriteItem) {
  return {
    entityType: item.entityType,
    entityId: item.entityId,
    favorite: false as const,
    space: item.rawSpace,
    asset: item.rawAsset,
  };
}

export function FavoritesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canRead = hasPermission("spaces:read") || hasPermission("assets:read");
  const canWrite =
    hasPermission("spaces:write") || hasPermission("assets:write");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<FavoriteListParams>({
    type: "ALL",
    sortBy: "favoritedAt",
    sortDir: "desc",
    page: 0,
    size: 20,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [shareResource, setShareResource] = useState<ShareResource | null>(null);

  const listParams = useMemo(
    () => ({ ...filters, q: debouncedSearch }),
    [debouncedSearch, filters],
  );

  const favoritesQuery = useFavorites(listParams);
  const unfavoriteMutation = useToggleFavorite();
  const bulkMutation = useBulkFavorite();
  const pinMutation = useToggleFavoritePin();

  const result = favoritesQuery.data;
  const items = result?.items ?? [];
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const actionsDisabled =
    unfavoriteMutation.isPending ||
    bulkMutation.isPending ||
    pinMutation.isPending;

  const handleFiltersChange = (next: Partial<FavoriteListParams>) => {
    setFilters((current) => ({ ...current, ...next }));
    setRowSelection({});
  };

  const handleView = (item: FavoriteItem) => {
    if (item.entityType === "SPACE") {
      router.push(`${ROUTES.SPACES}/${item.entityId}`);
      return;
    }
    // Assets page is not implemented yet — open the containing space when known.
    if (item.spaceId) {
      router.push(`${ROUTES.SPACES}/${item.spaceId}`);
      return;
    }
  };

  if (!canRead) {
    return (
      <ErrorState
        title="Access denied"
        message="You need spaces:read or assets:read permission to view favorites."
      />
    );
  }

  const apiError = favoritesQuery.error
    ? parseApiError(favoritesQuery.error)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <FavoritesToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          handleFiltersChange({ page: 0 });
        }}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        selectedCount={selectedIds.length}
      />

      {favoritesQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : result ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Recent favorites"
            value={result.recent.length}
            icon={<HeartIcon className="size-4" />}
          />
          <SummaryCard
            title="Favorite spaces"
            value={result.spaces.length}
            icon={<FolderIcon className="size-4" />}
          />
          <SummaryCard
            title="Favorite assets"
            value={result.assets.length}
            icon={<StarIcon className="size-4" />}
          />
          <SummaryCard
            title="Pinned"
            value={result.pinned.length}
            icon={<StarIcon className="size-4 fill-current" />}
          />
        </div>
      ) : null}

      <FavoritesBulkActions
        selectedCount={selectedIds.length}
        canWrite={canWrite}
        disabled={actionsDisabled}
        onUnfavorite={() => {
          void bulkMutation
            .mutateAsync({
              targets: selectedItems.map(toUnfavoriteTarget),
              favorite: false,
            })
            .then(() => setRowSelection({}));
        }}
        onShare={() => {
          const first = selectedItems[0];
          if (first) {
            setShareResource(toShareResource(first));
          }
        }}
        onClear={() => setRowSelection({})}
      />

      {favoritesQuery.isError ? (
        <ErrorState
          title={errorTitleForStatus(apiError?.status)}
          message={
            apiError?.status
              ? getErrorMessage(favoritesQuery.error)
              : `${getErrorMessage(favoritesQuery.error)}. Check your network connection and try again.`
          }
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void favoritesQuery.refetch()}
            >
              Retry
            </Button>
          }
        />
      ) : !favoritesQuery.isLoading && items.length === 0 ? (
        filters.type === "PINNED" ? (
          <EmptyState
            icon={StarIcon}
            title="No pinned favorites"
            description="Pin a favorite from the row menu to keep it at the top of your list."
          />
        ) : debouncedSearch.trim() ? (
          <EmptyState
            icon={SearchIcon}
            title="No search results"
            description={`Nothing matched “${debouncedSearch.trim()}”.`}
            action={
              <Button type="button" variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={HeartIcon}
            title="No favorites yet"
            description="Star spaces or assets to collect them here."
            action={
              <Button type="button" onClick={() => router.push(ROUTES.SPACES)}>
                Browse spaces
              </Button>
            }
          />
        )
      ) : (
        <>
          <FavoritesTable
            items={items}
            searchQuery={debouncedSearch}
            isLoading={favoritesQuery.isLoading}
            canWrite={canWrite}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            actionsDisabled={actionsDisabled}
            onView={handleView}
            onUnfavorite={(item) => void unfavoriteMutation.mutateAsync(item)}
            onShare={(item) => setShareResource(toShareResource(item))}
            onTogglePin={(item) => void pinMutation.mutateAsync(item.id)}
          />
          <FavoritesCards
            items={items}
            searchQuery={debouncedSearch}
            isLoading={favoritesQuery.isLoading}
            canWrite={canWrite}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            actionsDisabled={actionsDisabled}
            onView={handleView}
            onUnfavorite={(item) => void unfavoriteMutation.mutateAsync(item)}
            onShare={(item) => setShareResource(toShareResource(item))}
            onTogglePin={(item) => void pinMutation.mutateAsync(item.id)}
          />
          <FavoritesPagination
            page={result?.page ?? 0}
            size={result?.size ?? 20}
            total={result?.total ?? 0}
            totalPages={result?.totalPages ?? 0}
            onPageChange={(page) => handleFiltersChange({ page })}
            onSizeChange={(size) => handleFiltersChange({ size, page: 0 })}
          />
        </>
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

function SummaryCard({
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
