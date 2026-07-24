"use client";

import { Badge } from "@/components/ui/badge";
import type { SpaceType } from "@/features/spaces/types";
import { spaceTypeLabel } from "@/features/spaces/utils";

interface SpaceTypeBadgeProps {
  type: SpaceType;
  className?: string;
}

export function SpaceTypeBadge({ type, className }: SpaceTypeBadgeProps) {
  return (
    <Badge variant="outline" className={className} aria-label={`Type: ${spaceTypeLabel(type)}`}>
      {spaceTypeLabel(type)}
    </Badge>
  );
}
