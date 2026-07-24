"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightText } from "@/features/spaces/components/highlight-text";
import { SpaceColorSwatch } from "@/features/spaces/components/space-color-swatch";
import { SpaceRowActions } from "@/features/spaces/components/space-row-actions";
import { SpaceTypeBadge } from "@/features/spaces/components/space-type-badge";
import { SpaceVisibilityBadge } from "@/features/spaces/components/space-visibility-badge";
import type { Space } from "@/features/spaces/types";
import { formatRelativeTime } from "@/utils";
import type { RowSelectionState } from "@tanstack/react-table";

interface SpacesCardsProps {
  spaces: Space[];
  searchQuery?: string;
  isLoading?: boolean;
  canWrite: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  actionsDisabled?: boolean;
  onView: (space: Space) => void;
  onEdit: (space: Space) => void;
  onFavorite: (space: Space) => void;
  onArchive: (space: Space) => void;
  onRestore: (space: Space) => void;
  onDelete: (space: Space) => void;
}

export function SpacesCards({
  spaces,
  searchQuery = "",
  isLoading = false,
  canWrite,
  rowSelection,
  onRowSelectionChange,
  actionsDisabled = false,
  onView,
  onEdit,
  onFavorite,
  onArchive,
  onRestore,
  onDelete,
}: SpacesCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:hidden" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 md:hidden">
      {spaces.map((space) => {
        const selected = Boolean(rowSelection[space.id]);

        return (
          <li
            key={space.id}
            className="bg-card rounded-xl border p-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              {canWrite ? (
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const next = { ...rowSelection };
                    if (checked) {
                      next[space.id] = true;
                    } else {
                      delete next[space.id];
                    }
                    onRowSelectionChange(next);
                  }}
                  aria-label={`Select ${space.name}`}
                  className="mt-1"
                />
              ) : null}

              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                onClick={() => onView(space)}
              >
                <SpaceColorSwatch color={space.color} favorite={space.favorite} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">
                    <HighlightText text={space.name} query={searchQuery} />
                  </p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {space.description ? (
                      <HighlightText text={space.description} query={searchQuery} />
                    ) : (
                      "No description"
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <SpaceVisibilityBadge />
                    <SpaceTypeBadge type={space.type} />
                    <span className="text-muted-foreground text-xs">
                      Updated {formatRelativeTime(space.updatedAt)}
                    </span>
                  </div>
                </div>
              </button>

              <SpaceRowActions
                space={space}
                canWrite={canWrite}
                disabled={actionsDisabled}
                onView={onView}
                onEdit={onEdit}
                onFavorite={onFavorite}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
