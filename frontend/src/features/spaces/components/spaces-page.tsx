"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  ArchiveIcon,
  FolderIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ROUTES } from "@/constants";
import { SpacesBulkActions } from "@/features/spaces/components/spaces-bulk-actions";
import { SpacesCards } from "@/features/spaces/components/spaces-cards";
import { SpacesPagination } from "@/features/spaces/components/spaces-pagination";
import { SpacesToolbar } from "@/features/spaces/components/spaces-toolbar";
import {
  ArchiveSpaceDialog,
  CreateSpaceDialog,
  DeleteSpaceDialog,
  EditSpaceDialog,
  RestoreSpaceDialog,
} from "@/features/spaces/dialogs";
import {
  useArchiveSpace,
  useBulkArchiveSpaces,
  useBulkFavoriteSpaces,
  useDeleteSpace,
  useFavoriteSpace,
  useRestoreSpace,
  useSpaces,
} from "@/features/spaces/hooks";
import { SpacesTable } from "@/features/spaces/tables/spaces-table";
import type { Space, SpaceListParams } from "@/features/spaces/types";
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
      return "Unable to load spaces";
  }
}

export function SpacesPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canRead = hasPermission("spaces:read");
  const canWrite = hasPermission("spaces:write");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<SpaceListParams>({
    type: "ALL",
    visibility: "ALL",
    favoritesOnly: false,
    archivedOnly: false,
    storageUsage: "ALL",
    sortBy: "updatedAt",
    sortDir: "desc",
    page: 0,
    size: 20,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [editSpace, setEditSpace] = useState<Space | null>(null);
  const [archiveSpace, setArchiveSpace] = useState<Space | null>(null);
  const [deleteSpace, setDeleteSpace] = useState<Space | null>(null);
  const [restoreSpace, setRestoreSpace] = useState<Space | null>(null);
  const [bulkMode, setBulkMode] = useState<"archive" | "delete" | "restore" | null>(
    null,
  );

  const listParams = useMemo(
    () => ({
      ...filters,
      q: debouncedSearch,
    }),
    [debouncedSearch, filters],
  );

  const spacesQuery = useSpaces(listParams);
  const favoriteMutation = useFavoriteSpace();
  const archiveMutation = useArchiveSpace();
  const deleteMutation = useDeleteSpace();
  const restoreMutation = useRestoreSpace();
  const bulkArchiveMutation = useBulkArchiveSpaces();
  const bulkFavoriteMutation = useBulkFavoriteSpaces();

  const result = spacesQuery.data;
  const spaces = result?.items ?? [];
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedSpaces = spaces.filter((space) => selectedIds.includes(space.id));
  const actionsDisabled =
    favoriteMutation.isPending ||
    archiveMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending ||
    bulkArchiveMutation.isPending ||
    bulkFavoriteMutation.isPending;

  const handleFiltersChange = (next: Partial<SpaceListParams>) => {
    setFilters((current) => ({ ...current, ...next }));
    setRowSelection({});
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((current) => ({ ...current, page: 0 }));
    setRowSelection({});
  };

  const handleView = (space: Space) => {
    router.push(`${ROUTES.SPACES}/${space.id}`);
  };

  const emptyState = () => {
    if (filters.archivedOnly) {
      return (
        <EmptyState
          icon={ArchiveIcon}
          title="No archived spaces"
          description="The Spaces API currently lists active spaces only. Restore is not available yet."
        />
      );
    }
    if (filters.favoritesOnly) {
      return (
        <EmptyState
          icon={StarIcon}
          title="No favorite spaces"
          description="Star a space to pin it here for quick access."
        />
      );
    }
    if (debouncedSearch.trim()) {
      return (
        <EmptyState
          icon={SearchIcon}
          title="No search results"
          description={`Nothing matched “${debouncedSearch.trim()}”. Try another keyword or clear filters.`}
          action={
            <Button type="button" variant="outline" onClick={() => handleSearchChange("")}>
              Clear search
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={FolderIcon}
        title="No spaces yet"
        description="Create your first Life Space to organize assets."
        action={
          canWrite ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Create space
            </Button>
          ) : undefined
        }
      />
    );
  };

  if (!canRead) {
    return (
      <ErrorState
        title="Access denied"
        message="You need spaces:read permission to view Spaces."
      />
    );
  }

  const apiError = spacesQuery.error ? parseApiError(spacesQuery.error) : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <SpacesToolbar
        search={search}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        canWrite={canWrite}
        onCreate={() => setCreateOpen(true)}
        selectedCount={selectedIds.length}
      />

      <SpacesBulkActions
        selectedCount={selectedIds.length}
        canWrite={canWrite}
        disabled={actionsDisabled}
        archivedMode={Boolean(filters.archivedOnly)}
        onFavorite={() => {
          if (selectedSpaces.length === 0) return;
          void bulkFavoriteMutation.mutateAsync({
            spaces: selectedSpaces,
            favorite: true,
          }).then(() => setRowSelection({}));
        }}
        onArchive={() => setBulkMode("archive")}
        onRestore={() => setBulkMode("restore")}
        onDelete={() => setBulkMode("delete")}
        onClear={() => setRowSelection({})}
      />

      {spacesQuery.isError ? (
        <ErrorState
          title={errorTitleForStatus(apiError?.status)}
          message={
            apiError?.status
              ? getErrorMessage(spacesQuery.error)
              : `${getErrorMessage(spacesQuery.error)}. Check your network connection and try again.`
          }
          action={
            <Button type="button" variant="outline" onClick={() => void spacesQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : !spacesQuery.isLoading && spaces.length === 0 ? (
        emptyState()
      ) : (
        <>
          <SpacesTable
            spaces={spaces}
            searchQuery={debouncedSearch}
            isLoading={spacesQuery.isLoading}
            canWrite={canWrite}
            currentUserId={user?.id}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            actionsDisabled={actionsDisabled}
            onView={handleView}
            onEdit={setEditSpace}
            onFavorite={(space) =>
              void favoriteMutation.mutateAsync({
                space,
                favorite: !space.favorite,
              })
            }
            onArchive={setArchiveSpace}
            onRestore={setRestoreSpace}
            onDelete={setDeleteSpace}
          />
          <SpacesCards
            spaces={spaces}
            searchQuery={debouncedSearch}
            isLoading={spacesQuery.isLoading}
            canWrite={canWrite}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            actionsDisabled={actionsDisabled}
            onView={handleView}
            onEdit={setEditSpace}
            onFavorite={(space) =>
              void favoriteMutation.mutateAsync({
                space,
                favorite: !space.favorite,
              })
            }
            onArchive={setArchiveSpace}
            onRestore={setRestoreSpace}
            onDelete={setDeleteSpace}
          />
          <SpacesPagination
            page={result?.page ?? 0}
            size={result?.size ?? filters.size ?? 20}
            total={result?.total ?? 0}
            totalPages={result?.totalPages ?? 0}
            onPageChange={(page) => handleFiltersChange({ page })}
            onSizeChange={(size) => handleFiltersChange({ size, page: 0 })}
          />
        </>
      )}

      <CreateSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`${ROUTES.SPACES}/${id}`)}
      />

      <EditSpaceDialog
        space={editSpace}
        open={Boolean(editSpace)}
        onOpenChange={(open) => {
          if (!open) setEditSpace(null);
        }}
      />

      <ArchiveSpaceDialog
        space={archiveSpace}
        open={Boolean(archiveSpace)}
        onOpenChange={(open) => {
          if (!open) setArchiveSpace(null);
        }}
        isLoading={archiveMutation.isPending}
        onConfirm={() => {
          if (!archiveSpace) return;
          void archiveMutation.mutateAsync(archiveSpace.id).then(() => {
            setArchiveSpace(null);
            setRowSelection({});
          });
        }}
      />

      <DeleteSpaceDialog
        space={deleteSpace}
        open={Boolean(deleteSpace)}
        onOpenChange={(open) => {
          if (!open) setDeleteSpace(null);
        }}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteSpace) return;
          void deleteMutation.mutateAsync(deleteSpace.id).then(() => {
            setDeleteSpace(null);
            setRowSelection({});
          });
        }}
      />

      <RestoreSpaceDialog
        space={restoreSpace}
        open={Boolean(restoreSpace)}
        onOpenChange={(open) => {
          if (!open) setRestoreSpace(null);
        }}
        isLoading={restoreMutation.isPending}
        onConfirm={() => {
          if (!restoreSpace) return;
          void restoreMutation.mutateAsync(restoreSpace.id).finally(() => {
            setRestoreSpace(null);
          });
        }}
      />

      <ArchiveSpaceDialog
        space={selectedSpaces[0] ?? null}
        open={bulkMode === "archive"}
        onOpenChange={(open) => {
          if (!open) setBulkMode(null);
        }}
        isLoading={bulkArchiveMutation.isPending}
        onConfirm={() => {
          void bulkArchiveMutation.mutateAsync(selectedIds).then(() => {
            setBulkMode(null);
            setRowSelection({});
          });
        }}
      />

      <DeleteSpaceDialog
        space={selectedSpaces[0] ?? null}
        open={bulkMode === "delete"}
        onOpenChange={(open) => {
          if (!open) setBulkMode(null);
        }}
        isLoading={bulkArchiveMutation.isPending}
        onConfirm={() => {
          void bulkArchiveMutation.mutateAsync(selectedIds).then(() => {
            setBulkMode(null);
            setRowSelection({});
          });
        }}
      />

      <RestoreSpaceDialog
        space={selectedSpaces[0] ?? null}
        open={bulkMode === "restore"}
        onOpenChange={(open) => {
          if (!open) setBulkMode(null);
        }}
        isLoading={restoreMutation.isPending}
        onConfirm={() => {
          const first = selectedIds[0];
          if (!first) return;
          void restoreMutation.mutateAsync(first).finally(() => setBulkMode(null));
        }}
      />
    </div>
  );
}
