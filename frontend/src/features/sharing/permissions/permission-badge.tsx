"use client";

import { Badge } from "@/components/ui/badge";
import type { SharePermission } from "@/features/sharing/types";
import { permissionLabel } from "@/features/sharing/utils";
import { cn } from "@/utils";

const VARIANT_MAP: Record<
  SharePermission,
  "default" | "secondary" | "outline" | "destructive"
> = {
  VIEWER: "outline",
  COMMENTER: "secondary",
  EDITOR: "default",
  OWNER: "destructive",
};

interface PermissionBadgeProps {
  permission: SharePermission;
  className?: string;
}

export function PermissionBadge({
  permission,
  className,
}: PermissionBadgeProps) {
  return (
    <Badge
      variant={VARIANT_MAP[permission]}
      className={cn(className)}
      aria-label={`Permission: ${permissionLabel(permission)}`}
    >
      {permissionLabel(permission)}
    </Badge>
  );
}
