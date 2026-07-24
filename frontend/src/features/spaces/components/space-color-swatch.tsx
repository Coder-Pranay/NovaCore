"use client";

import { StarIcon } from "lucide-react";

import { cn } from "@/utils";

interface SpaceColorSwatchProps {
  color: string | null;
  favorite?: boolean;
  className?: string;
}

export function SpaceColorSwatch({
  color,
  favorite = false,
  className,
}: SpaceColorSwatchProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg border",
        className,
      )}
      style={{
        backgroundColor: color ?? "var(--muted)",
      }}
      aria-hidden="true"
    >
      {favorite ? (
        <StarIcon className="size-3.5 fill-amber-400 text-amber-500 drop-shadow-sm" />
      ) : null}
    </span>
  );
}
