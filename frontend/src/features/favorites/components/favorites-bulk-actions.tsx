"use client";

import { PinIcon, Share2Icon, StarOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FavoritesBulkActionsProps {
  selectedCount: number;
  canWrite: boolean;
  disabled?: boolean;
  onUnfavorite: () => void;
  onShare: () => void;
  onClear: () => void;
}

export function FavoritesBulkActions({
  selectedCount,
  canWrite,
  disabled = false,
  onUnfavorite,
  onShare,
  onClear,
}: FavoritesBulkActionsProps) {
  if (selectedCount === 0 || !canWrite) {
    return null;
  }

  return (
    <div
      className="bg-card flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm"
      role="toolbar"
      aria-label="Bulk favorite actions"
    >
      <p className="text-muted-foreground mr-2 text-sm">
        {selectedCount} selected
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onUnfavorite}
      >
        <StarOffIcon className="size-3.5" aria-hidden="true" />
        Unfavorite
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onShare}
      >
        <Share2Icon className="size-3.5" aria-hidden="true" />
        Share
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
      <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex">
        <PinIcon className="size-3" aria-hidden="true" />
        Pin individually from the row menu
      </span>
    </div>
  );
}
