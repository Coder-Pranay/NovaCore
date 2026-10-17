"use client";

import { PageLoader } from "@/components/global/page-loader";
import { useAuth } from "@/hooks/use-auth";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Keeps the private tree mounted once authenticated so child state
 * (e.g. upload queues) is not wiped by brief loading flickers.
 */
export function RequireAuth({
  children,
  fallback = <PageLoader label="Checking authentication" />,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading && !isAuthenticated) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
}
