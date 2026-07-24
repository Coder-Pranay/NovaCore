"use client";

import {
  ArchiveIcon,
  RotateCcwIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface SpacesBulkActionsProps {
  selectedCount: number;
  canWrite: boolean;
  disabled?: boolean;
  archivedMode?: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onClear: () => void;
}

export function SpacesBulkActions({
  selectedCount,
  canWrite,
  disabled = false,
  archivedMode = false,
  onArchive,
  onRestore,
  onDelete,
  onFavorite,
  onClear,
}: SpacesBulkActionsProps) {
  if (selectedCount === 0 || !canWrite) {
    return null;
  }

  return (
    <div
      className="bg-card flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm"
      role="toolbar"
      aria-label="Bulk space actions"
    >
      <p className="text-muted-foreground mr-2 text-sm">
        {selectedCount} selected
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onFavorite}
      >
        <StarIcon className="size-3.5" aria-hidden="true" />
        Favorite
      </Button>
      {archivedMode ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onRestore}
        >
          <RotateCcwIcon className="size-3.5" aria-hidden="true" />
          Restore
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onArchive}
        >
          <ArchiveIcon className="size-3.5" aria-hidden="true" />
          Archive
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={disabled}
        onClick={onDelete}
      >
        <Trash2Icon className="size-3.5" aria-hidden="true" />
        Delete
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
