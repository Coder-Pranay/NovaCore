export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  UNAUTHORIZED: "/unauthorized",
  OFFLINE: "/offline",
  NOT_FOUND: "/404",
  DASHBOARD: "/dashboard",
  SPACES: "/spaces",
  /** Coming-soon placeholder page exists at `/assets` (full library TBD). */
  ASSETS: "/assets",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  SEARCH: "/search",
  FAVORITES: "/favorites",
  SHARED: "/shared",
  STORAGE: "/storage",
  ANALYTICS: "/analytics",
  NOTIFICATIONS: "/notifications",
  AI: "/ai",
  CHANGE_PASSWORD: "/settings/change-password",
  SHARED_LINK: "/shared/link",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const AUTH_COOKIE_NAME = "novacore-authenticated";

/**
 * Routes that must not be used as post-login redirects into unfinished product flows.
 * Prefer dedicated Coming Soon pages over silent 404s for known stubs.
 */
export const UNIMPLEMENTED_ROUTES: readonly string[] = [] as const;

export function isUnimplementedRoute(pathname: string): boolean {
  return UNIMPLEMENTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Routes accessible without authentication */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.NOT_FOUND,
  ROUTES.UNAUTHORIZED,
  ROUTES.OFFLINE,
  ROUTES.SHARED_LINK,
] as const;

/** Routes that require authentication and have implemented pages */
export const PRIVATE_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.SPACES,
  ROUTES.ASSETS,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.SEARCH,
  ROUTES.FAVORITES,
  ROUTES.SHARED,
  ROUTES.STORAGE,
  ROUTES.ANALYTICS,
  ROUTES.NOTIFICATIONS,
  ROUTES.AI,
  ROUTES.CHANGE_PASSWORD,
] as const;

/** Routes only for unauthenticated users */
export const GUEST_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isGuestRoute(pathname: string): boolean {
  return GUEST_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPrivateRoute(pathname: string): boolean {
  if (isPublicRoute(pathname) || isGuestRoute(pathname)) {
    return false;
  }

  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
