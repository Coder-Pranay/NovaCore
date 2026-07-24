import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAME,
  isGuestRoute,
  isPrivateRoute,
  isPublicRoute,
  ROUTES,
} from "@/constants/routes";

function hasAuthSession(request: NextRequest): boolean {
  return request.cookies.has(AUTH_COOKIE_NAME);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasAuthSession(request);

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isGuestRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (isPrivateRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
