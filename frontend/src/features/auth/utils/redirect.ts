import { isUnimplementedRoute, ROUTES } from "@/constants";

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback: string = ROUTES.DASHBOARD,
): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.startsWith(ROUTES.LOGIN)) {
    return fallback;
  }

  if (isUnimplementedRoute(value)) {
    return fallback;
  }

  return value;
}
