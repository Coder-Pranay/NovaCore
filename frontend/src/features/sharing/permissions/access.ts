import type { AuthenticatedUser } from "@/types/api";
import { hasPermission } from "@/features/auth/utils/authorization";

export function canManageSharing(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, "sharing:write");
}

export function canInviteCollaborators(user: AuthenticatedUser | null): boolean {
  return (
    hasPermission(user, "sharing:write") ||
    hasPermission(user, "spaces:write") ||
    hasPermission(user, "assets:write")
  );
}
