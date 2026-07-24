"use client";

import { StarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

interface FavoriteBadgeProps {
  className?: string;
  label?: string;
}

export function FavoriteBadge({
  className,
  label = "Favorite",
}: FavoriteBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <StarIcon className="size-3 fill-amber-400 text-amber-500" aria-hidden="true" />
      {label}
    </Badge>
  );
}

interface FavoriteToggleProps {
  favorited: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}

export function FavoriteToggle({
  favorited,
  disabled = false,
  onToggle,
  label,
  className,
}: FavoriteToggleProps) {
  const text = label ?? (favorited ? "Unfavorite" : "Favorite");

  return (
    <Button
      type="button"
      variant={favorited ? "secondary" : "outline"}
      size="sm"
      disabled={disabled}
      aria-pressed={favorited}
      aria-label={text}
      onClick={onToggle}
      className={className}
    >
      <StarIcon
        className={cn(
          "size-4",
          favorited && "fill-amber-400 text-amber-500",
        )}
        aria-hidden="true"
      />
      {text}
    </Button>
  );
}
