import { AUTH_COOKIE_NAME } from "@/constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthCookie(rememberMe = false): void {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
