"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  MoreHorizontalIcon,
  PinIcon,
  Share2Icon,
  StarOffIcon,
  EyeIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteBadge } from "@/features/favorites/components/favorite-toggle";
import type { FavoriteItem } from "@/features/favorites/types";
import { splitHighlight } from "@/features/favorites/utils";
import { formatRelativeTime, cn } from "@/utils";

interface FavoritesTableProps {
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

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlight(text, query).map((part, index) =>
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className="bg-primary/20 text-foreground rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function FavoritesTable({
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
}: FavoritesTableProps) {
  const columns = useMemo<ColumnDef<FavoriteItem>[]>(
    () => [
      {
        id: "select",
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(Boolean(checked))
            }
            aria-label="Select all favorites"
            disabled={!canWrite}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            aria-label={`Select ${row.original.name}`}
            disabled={!canWrite}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 text-left hover:underline"
            onClick={() => onView(row.original)}
          >
            <span className="truncate font-medium">
              <Highlight text={row.original.name} query={searchQuery} />
            </span>
            {row.original.pinned ? (
              <PinIcon className="text-muted-foreground size-3.5 shrink-0" />
            ) : null}
          </button>
        ),
      },
      {
        accessorKey: "entityType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.entityType === "SPACE" ? "Space" : "Asset"}
          </Badge>
        ),
      },
      {
        id: "meta",
        header: "Details",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.entityType === "ASSET"
              ? (row.original.assetType ?? "File")
              : "Life Space"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: () => <FavoriteBadge />,
      },
      {
        accessorKey: "favoritedAt",
        header: "Favorited",
        cell: ({ row }) => formatRelativeTime(row.original.favoritedAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={actionsDisabled}
              aria-label={`Actions for ${row.original.name}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <EyeIcon className="size-4" />
                View
              </DropdownMenuItem>
              {canWrite ? (
                <>
                  <DropdownMenuItem onClick={() => onTogglePin(row.original)}>
                    <PinIcon className="size-4" />
                    {row.original.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(row.original)}>
                    <Share2Icon className="size-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUnfavorite(row.original)}>
                    <StarOffIcon className="size-4" />
                    Unfavorite
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      actionsDisabled,
      canWrite,
      onShare,
      onTogglePin,
      onUnfavorite,
      onView,
      searchQuery,
    ],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    enableRowSelection: canWrite,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="hidden space-y-2 md:block" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="border-border hidden overflow-hidden rounded-xl border md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-muted-foreground px-3 py-2.5 text-left text-xs font-medium tracking-wide uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/30 border-b last:border-b-0"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
