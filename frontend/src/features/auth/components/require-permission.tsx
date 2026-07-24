"use client";

import { UnauthorizedView } from "@/components/global/unauthorized-view";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/features/auth/utils/authorization";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = (
    <UnauthorizedView description="You do not have permission to access this resource." />
  ),
}: RequirePermissionProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (!isAuthenticated || !hasPermission(user, permission)) {
    return fallback;
  }

  return children;
}
