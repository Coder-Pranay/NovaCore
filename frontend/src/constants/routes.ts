export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "/404",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Routes accessible without authentication */
export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.NOT_FOUND] as const;

/** Routes that require authentication */
export const PRIVATE_ROUTES: readonly string[] = [];

/** Routes only for unauthenticated users (e.g. login, register) */
export const GUEST_ROUTES = [ROUTES.LOGIN] as const;

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

  if (PRIVATE_ROUTES.length === 0) {
    return false;
  }

  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
