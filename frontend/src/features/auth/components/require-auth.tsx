"use client";

import { PageLoader } from "@/components/global/page-loader";
import { useAuth } from "@/hooks/use-auth";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({
  children,
  fallback = <PageLoader label="Checking authentication" />,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
}
