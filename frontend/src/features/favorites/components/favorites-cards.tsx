"use client";

import { PinIcon, Share2Icon, StarOffIcon } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteBadge } from "@/features/favorites/components/favorite-toggle";
import type { FavoriteItem } from "@/features/favorites/types";
import { splitHighlight } from "@/features/favorites/utils";
import { formatRelativeTime } from "@/utils";

interface FavoritesCardsProps {
  items: FavoriteItem[];
  searchQuery?: string;
  isLoading?: boolean;
  canWrite: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  actionsDisabled?: boolean;
  onView: (item: FavoriteItem) => void;
  onUnfavorite: (item: FavoriteItem) => void;
  onShare: (item: FavoriteItem) => void;
  onTogglePin: (item: FavoriteItem) => void;
}

export function FavoritesCards({
  items,
  searchQuery = "",
  isLoading = false,
  canWrite,
  rowSelection,
  onRowSelectionChange,
  actionsDisabled = false,
  onView,
  onUnfavorite,
  onShare,
  onTogglePin,
}: FavoritesCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:hidden" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 md:hidden">
      {items.map((item) => {
        const selected = Boolean(rowSelection[item.id]);
        return (
          <li key={item.id} className="bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-start gap-3">
              {canWrite ? (
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const next = { ...rowSelection };
                    if (checked) {
                      next[item.id] = true;
                    } else {
                      delete next[item.id];
                    }
                    onRowSelectionChange(next);
                  }}
                  aria-label={`Select ${item.name}`}
                  className="mt-1"
                />
              ) : null}

              <button
                type="button"
                className="min-w-0 flex-1 space-y-2 text-left"
                onClick={() => onView(item)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {splitHighlight(item.name, searchQuery).map((part, index) =>
                      part.match ? (
                        <mark
                          key={`${part.text}-${index}`}
                          className="bg-primary/20 rounded-sm px-0.5"
                        >
                          {part.text}
                        </mark>
                      ) : (
                        <span key={`${part.text}-${index}`}>{part.text}</span>
                      ),
                    )}
                  </p>
                  <FavoriteBadge />
                  {item.pinned ? (
                    <Badge variant="outline" className="gap-1">
                      <PinIcon className="size-3" />
                      Pinned
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {item.description || "No description"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {item.entityType === "SPACE" ? "Space" : "Asset"} ·{" "}
                  {formatRelativeTime(item.favoritedAt)}
                </p>
              </button>
            </div>

            {canWrite ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actionsDisabled}
                  onClick={() => onTogglePin(item)}
                >
                  <PinIcon className="size-3.5" />
                  {item.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actionsDisabled}
                  onClick={() => onShare(item)}
                >
                  <Share2Icon className="size-3.5" />
                  Share
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={actionsDisabled}
                  onClick={() => onUnfavorite(item)}
                >
                  <StarOffIcon className="size-3.5" />
                  Unfavorite
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
