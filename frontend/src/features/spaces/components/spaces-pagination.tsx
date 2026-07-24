"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils";

interface SpacesPaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function SpacesPagination({
  page,
  size,
  total,
  totalPages,
  onPageChange,
  onSizeChange,
}: SpacesPaginationProps) {
  if (total === 0) {
    return null;
  }

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="spaces-page-size" className="text-muted-foreground text-xs">
            Rows
          </Label>
          <select
            id="spaces-page-size"
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className={cn(
              "border-input bg-background h-8 rounded-lg border px-2 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
            )}
          >
            {[10, 20, 30, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm">
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
