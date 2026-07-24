"use client";

import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  StarIcon,
  Trash2Icon,
  EyeIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Space } from "@/features/spaces/types";
import { cn } from "@/utils";

interface SpaceRowActionsProps {
  space: Space;
  canWrite: boolean;
  disabled?: boolean;
  onView: (space: Space) => void;
  onEdit: (space: Space) => void;
  onFavorite: (space: Space) => void;
  onArchive: (space: Space) => void;
  onRestore: (space: Space) => void;
  onDelete: (space: Space) => void;
}

export function SpaceRowActions({
  space,
  canWrite,
  disabled = false,
  onView,
  onEdit,
  onFavorite,
  onArchive,
  onRestore,
  onDelete,
}: SpaceRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`Actions for ${space.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onView(space)}>
          <EyeIcon className="size-4" />
          View
        </DropdownMenuItem>
        {canWrite ? (
          <>
            <DropdownMenuItem onClick={() => onEdit(space)}>
              <PencilIcon className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFavorite(space)}>
              <StarIcon className="size-4" />
              {space.favorite ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {space.archived ? (
              <DropdownMenuItem onClick={() => onRestore(space)}>
                <RotateCcwIcon className="size-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onArchive(space)}>
                <ArchiveIcon className="size-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(space)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
