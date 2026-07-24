"use client";

import {
  ArchiveIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPACE_TYPE_OPTIONS } from "@/features/spaces/schemas";
import type { SpaceListParams, SpaceSortField } from "@/features/spaces/types";
import { cn } from "@/utils";

const SORT_OPTIONS: Array<{ value: SpaceSortField; label: string }> = [
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created date" },
  { value: "updatedAt", label: "Updated date" },
  { value: "assetsCount", label: "Assets count" },
  { value: "storageUsed", label: "Storage used" },
];

interface SpacesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: SpaceListParams;
  onFiltersChange: (next: Partial<SpaceListParams>) => void;
  canWrite: boolean;
  onCreate: () => void;
  selectedCount: number;
}

export function SpacesToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  canWrite,
  onCreate,
  selectedCount,
}: SpacesToolbarProps) {
  const hasActiveFilters =
    Boolean(filters.q) ||
    (filters.type && filters.type !== "ALL") ||
    Boolean(filters.favoritesOnly) ||
    Boolean(filters.archivedOnly) ||
    (filters.visibility && filters.visibility !== "ALL") ||
    Boolean(filters.createdFrom) ||
    Boolean(filters.createdTo) ||
    (filters.storageUsage && filters.storageUsage !== "ALL");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground text-sm">
            Organize your digital life into Life Spaces.
            {selectedCount > 0 ? ` ${selectedCount} selected.` : null}
          </p>
        </div>
        {canWrite ? (
          <Button type="button" onClick={onCreate} className="shrink-0">
            <PlusIcon className="size-4" aria-hidden="true" />
            Create space
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="spaces-search" className="sr-only">
            Search spaces
          </Label>
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="spaces-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, description, or type..."
            className="pl-9"
            aria-label="Search spaces"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            id="spaces-type"
            label="Type"
            value={filters.type ?? "ALL"}
            onChange={(value) =>
              onFiltersChange({
                type: value as SpaceListParams["type"],
                page: 0,
              })
            }
            options={[
              { value: "ALL", label: "All types" },
              ...SPACE_TYPE_OPTIONS,
            ]}
          />

          <FilterSelect
            id="spaces-visibility"
            label="Visibility"
            value={filters.visibility ?? "ALL"}
            onChange={(value) =>
              onFiltersChange({
                visibility: value as SpaceListParams["visibility"],
                page: 0,
              })
            }
            options={[
              { value: "ALL", label: "All visibility" },
              { value: "PRIVATE", label: "Private" },
              { value: "TEAM", label: "Team" },
              { value: "PUBLIC", label: "Public" },
            ]}
          />

          <FilterSelect
            id="spaces-storage"
            label="Storage"
            value={filters.storageUsage ?? "ALL"}
            onChange={(value) =>
              onFiltersChange({
                storageUsage: value as SpaceListParams["storageUsage"],
                page: 0,
              })
            }
            options={[
              { value: "ALL", label: "Any storage" },
              { value: "EMPTY", label: "Empty" },
              { value: "USED", label: "In use" },
            ]}
          />

          <FilterSelect
            id="spaces-sort"
            label="Sort by"
            value={filters.sortBy ?? "updatedAt"}
            onChange={(value) =>
              onFiltersChange({
                sortBy: value as SpaceSortField,
                page: 0,
              })
            }
            options={SORT_OPTIONS}
          />

          <FilterSelect
            id="spaces-sort-dir"
            label="Order"
            value={filters.sortDir ?? "desc"}
            onChange={(value) =>
              onFiltersChange({
                sortDir: value as "asc" | "desc",
                page: 0,
              })
            }
            options={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
          />

          <div className="space-y-1.5">
            <Label htmlFor="spaces-created-from">Created from</Label>
            <Input
              id="spaces-created-from"
              type="date"
              value={filters.createdFrom ?? ""}
              onChange={(event) =>
                onFiltersChange({
                  createdFrom: event.target.value || undefined,
                  page: 0,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleChip
          active={Boolean(filters.favoritesOnly)}
          onClick={() =>
            onFiltersChange({
              favoritesOnly: !filters.favoritesOnly,
              archivedOnly: false,
              page: 0,
            })
          }
          icon={<StarIcon className="size-3.5" aria-hidden="true" />}
          label="Favorites"
        />
        <ToggleChip
          active={Boolean(filters.archivedOnly)}
          onClick={() =>
            onFiltersChange({
              archivedOnly: !filters.archivedOnly,
              favoritesOnly: false,
              page: 0,
            })
          }
          icon={<ArchiveIcon className="size-3.5" aria-hidden="true" />}
          label="Archived"
        />
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                q: "",
                type: "ALL",
                visibility: "ALL",
                favoritesOnly: false,
                archivedOnly: false,
                createdFrom: undefined,
                createdTo: undefined,
                storageUsage: "ALL",
                sortBy: "updatedAt",
                sortDir: "desc",
                page: 0,
              })
            }
          >
            <XIcon className="size-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
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

function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
