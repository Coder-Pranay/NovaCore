"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import {
  Columns3Icon,
  DownloadIcon,
  Rows3Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightText } from "@/features/spaces/components/highlight-text";
import { SpaceColorSwatch } from "@/features/spaces/components/space-color-swatch";
import { SpaceRowActions } from "@/features/spaces/components/space-row-actions";
import { SpaceTypeBadge } from "@/features/spaces/components/space-type-badge";
import { SpaceVisibilityBadge } from "@/features/spaces/components/space-visibility-badge";
import type { Space } from "@/features/spaces/types";
import { formatDate, formatRelativeTime } from "@/utils";
import { cn } from "@/utils";

type TableDensity = "comfortable" | "compact";

interface SpacesTableProps {
  spaces: Space[];
  searchQuery?: string;
  isLoading?: boolean;
  canWrite: boolean;
  currentUserId?: string;
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

const HIDEABLE_COLUMNS = [
  { id: "description", label: "Description" },
  { id: "owner", label: "Owner" },
  { id: "members", label: "Members" },
  { id: "assetsCount", label: "Assets" },
  { id: "storageUsed", label: "Storage" },
  { id: "visibility", label: "Visibility" },
  { id: "type", label: "Type" },
  { id: "createdAt", label: "Created" },
  { id: "updatedAt", label: "Updated" },
] as const;

export function SpacesTable({
  spaces,
  searchQuery = "",
  isLoading = false,
  canWrite,
  currentUserId,
  rowSelection,
  onRowSelectionChange,
  actionsDisabled = false,
  onView,
  onEdit,
  onFavorite,
  onArchive,
  onRestore,
  onDelete,
}: SpacesTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [density, setDensity] = useState<TableDensity>("comfortable");

  const cellPad = density === "compact" ? "px-2 py-1.5" : "px-3 py-2.5";

  const columns = useMemo<ColumnDef<Space>[]>(
    () => [
      {
        id: "select",
        enableResizing: false,
        enableHiding: false,
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(Boolean(checked))
            }
            aria-label="Select all spaces on this page"
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
        enableHiding: false,
        size: 220,
        cell: ({ row }) => (
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 text-left hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => onView(row.original)}
          >
            <SpaceColorSwatch
              color={row.original.color}
              favorite={row.original.favorite}
            />
            <span className="truncate font-medium">
              <HighlightText text={row.original.name} query={searchQuery} />
            </span>
          </button>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 240,
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-2 text-sm">
            {row.original.description ? (
              <HighlightText text={row.original.description} query={searchQuery} />
            ) : (
              "—"
            )}
          </span>
        ),
      },
      {
        id: "owner",
        header: "Owner",
        size: 100,
        cell: ({ row }) =>
          row.original.ownerId === currentUserId ? "You" : "Owner",
      },
      {
        id: "members",
        header: "Members",
        size: 90,
        cell: () => "1",
      },
      {
        id: "assetsCount",
        header: "Assets",
        size: 80,
        cell: () => (
          <span className="text-muted-foreground" title="Open space for counts">
            —
          </span>
        ),
      },
      {
        id: "storageUsed",
        header: "Storage",
        size: 90,
        cell: () => (
          <span className="text-muted-foreground" title="Open space for storage">
            —
          </span>
        ),
      },
      {
        id: "visibility",
        header: "Visibility",
        size: 100,
        cell: () => <SpaceVisibilityBadge />,
      },
      {
        id: "type",
        header: "Type",
        size: 110,
        cell: ({ row }) => <SpaceTypeBadge type={row.original.type} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 120,
        cell: ({ row }) => formatDate(row.original.createdAt, "MMM d, yyyy"),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        size: 120,
        cell: ({ row }) => formatRelativeTime(row.original.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        enableResizing: false,
        enableHiding: false,
        size: 64,
        cell: ({ row }) => (
          <SpaceRowActions
            space={row.original}
            canWrite={canWrite}
            disabled={actionsDisabled}
            onView={onView}
            onEdit={onEdit}
            onFavorite={onFavorite}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [
      actionsDisabled,
      canWrite,
      currentUserId,
      onArchive,
      onDelete,
      onEdit,
      onFavorite,
      onRestore,
      onView,
      searchQuery,
    ],
  );

  const table = useReactTable({
    data: spaces,
    columns,
    state: { rowSelection, columnVisibility },
    enableRowSelection: canWrite,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  const handleCsvExport = useCallback(() => {
    toast.message("CSV export coming soon", {
      description: "Export will download the current filtered spaces as CSV.",
    });
  }, []);

  const toggleDensity = useCallback(() => {
    setDensity((current) =>
      current === "comfortable" ? "compact" : "comfortable",
    );
  }, []);

  if (isLoading) {
    return (
      <div className="hidden space-y-2 md:block" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden space-y-3 md:block">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleDensity}
          aria-pressed={density === "compact"}
        >
          <Rows3Icon className="size-3.5" aria-hidden="true" />
          {density === "compact" ? "Comfortable" : "Compact"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center gap-1.5",
            )}
          >
            <Columns3Icon className="size-3.5" aria-hidden="true" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {HIDEABLE_COLUMNS.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={table.getColumn(column.id)?.getIsVisible() ?? true}
                onCheckedChange={(checked) =>
                  table.getColumn(column.id)?.toggleVisibility(Boolean(checked))
                }
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button type="button" size="sm" variant="outline" onClick={handleCsvExport}>
          <DownloadIcon className="size-3.5" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <table
            className="w-full min-w-[1100px] border-collapse text-sm"
            aria-label="Spaces table"
          >
            <thead className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "text-muted-foreground bg-muted/80 relative text-left text-xs font-medium tracking-wide uppercase",
                        cellPad,
                      )}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanResize() ? (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
                            header.column.getIsResizing() && "bg-primary/40",
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("align-middle", cellPad)}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
