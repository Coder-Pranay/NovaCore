"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoader } from "@/components/global/page-loader";
import { useAuth } from "@/hooks/use-auth";
import {
  GUEST_ROUTES,
  isGuestRoute,
  isPrivateRoute,
  isPublicRoute,
  ROUTES,
} from "@/constants";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isPrivateRoute(pathname) && !isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isGuestRoute(pathname) && isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Guest/public pages must render immediately — do not block on session restore.
  // Once authenticated, keep the tree mounted during loading flickers so local
  // UI state (upload queues, form drafts) is not destroyed.
  if (
    isLoading &&
    !isAuthenticated &&
    !isGuestRoute(pathname) &&
    !isPublicRoute(pathname)
  ) {
    return <PageLoader label="Checking authentication" />;
  }

  if (!isLoading && isPrivateRoute(pathname) && !isAuthenticated) {
    return <PageLoader label="Redirecting to sign in" />;
  }

  if (!isLoading && isGuestRoute(pathname) && isAuthenticated) {
    return <PageLoader label="Redirecting" />;
  }

  return children;
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ROUTES.some((route) => pathname.startsWith(route));
}
