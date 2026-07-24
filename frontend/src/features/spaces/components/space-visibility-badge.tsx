"use client";

import { Badge } from "@/components/ui/badge";
import type { SpaceVisibility } from "@/features/spaces/types";
import { spaceVisibilityLabel } from "@/features/spaces/utils";

interface SpaceVisibilityBadgeProps {
  visibility?: SpaceVisibility;
  className?: string;
}

export function SpaceVisibilityBadge({
  visibility = "PRIVATE",
  className,
}: SpaceVisibilityBadgeProps) {
  const label = spaceVisibilityLabel(visibility);

  return (
    <Badge variant="secondary" className={className} aria-label={`Visibility: ${label}`}>
      {label}
    </Badge>
  );
}
