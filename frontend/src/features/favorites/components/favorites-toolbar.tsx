"use client";

import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  FavoriteFilterType,
  FavoriteListParams,
  FavoriteSortField,
} from "@/features/favorites/types";
import { cn } from "@/utils";

interface FavoritesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FavoriteListParams;
  onFiltersChange: (next: Partial<FavoriteListParams>) => void;
  selectedCount: number;
}

export function FavoritesToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  selectedCount,
}: FavoritesToolbarProps) {
  const hasFilters =
    Boolean(filters.q) ||
    (filters.type && filters.type !== "ALL") ||
    (filters.sortBy && filters.sortBy !== "favoritedAt");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground text-sm">
          Spaces and assets you have starred for quick access.
          {selectedCount > 0 ? ` ${selectedCount} selected.` : null}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="favorites-search" className="sr-only">
            Search favorites
          </Label>
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="favorites-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search favorites..."
            className="pl-9"
            aria-label="Search favorites"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="favorites-type">Type</Label>
            <select
              id="favorites-type"
              value={filters.type ?? "ALL"}
              onChange={(event) =>
                onFiltersChange({
                  type: event.target.value as FavoriteFilterType,
                  page: 0,
                })
              }
              className={selectClassName}
            >
              <option value="ALL">All</option>
              <option value="SPACE">Spaces</option>
              <option value="ASSET">Assets</option>
              <option value="PINNED">Pinned</option>
              <option value="RECENT">Recently added</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="favorites-sort">Sort</Label>
            <select
              id="favorites-sort"
              value={filters.sortBy ?? "favoritedAt"}
              onChange={(event) =>
                onFiltersChange({
                  sortBy: event.target.value as FavoriteSortField,
                  page: 0,
                })
              }
              className={selectClassName}
            >
              <option value="favoritedAt">Recently added</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="name">Name</option>
              <option value="entityType">Type</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="favorites-dir">Order</Label>
            <select
              id="favorites-dir"
              value={filters.sortDir ?? "desc"}
              onChange={(event) =>
                onFiltersChange({
                  sortDir: event.target.value as "asc" | "desc",
                  page: 0,
                })
              }
              className={selectClassName}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onFiltersChange({
              q: "",
              type: "ALL",
              sortBy: "favoritedAt",
              sortDir: "desc",
              page: 0,
            });
          }}
        >
          <XIcon className="size-3.5" aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

const selectClassName = cn(
  "border-input bg-background flex h-9 w-full rounded-lg border px-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
);
