"use client";

import { UnauthorizedView } from "@/components/global/unauthorized-view";
import { useAuth } from "@/hooks/use-auth";
import { hasRole } from "@/features/auth/utils/authorization";

interface RequireRoleProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({
  role,
  children,
  fallback = (
    <UnauthorizedView description="You do not have the required role to access this page." />
  ),
}: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (!isAuthenticated || !hasRole(user, role)) {
    return fallback;
  }

  return children;
}
