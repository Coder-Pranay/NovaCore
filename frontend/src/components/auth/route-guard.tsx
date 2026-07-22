"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoader } from "@/components/global/page-loader";
import { useAuth } from "@/hooks";
import {
  GUEST_ROUTES,
  isGuestRoute,
  isPrivateRoute,
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
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (isGuestRoute(pathname) && isAuthenticated) {
      router.replace(ROUTES.HOME);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <PageLoader label="Checking authentication" />;
  }

  if (isPrivateRoute(pathname) && !isAuthenticated) {
    return <PageLoader label="Redirecting to sign in" />;
  }

  if (isGuestRoute(pathname) && isAuthenticated) {
    return <PageLoader label="Redirecting" />;
  }

  return children;
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ROUTES.some((route) => pathname.startsWith(route));
}
