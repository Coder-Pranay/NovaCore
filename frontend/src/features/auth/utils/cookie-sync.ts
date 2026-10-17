/**
 * Client-side cookie helpers are intentionally empty.
 * Auth cookies (novacore_access, novacore_refresh, novacore_session) are HttpOnly
 * and set/cleared only by the backend.
 */

export function setAuthCookie(_rememberMe = false): void {
  void _rememberMe;
  // no-op — session flag is Set-Cookie from /v1/auth/login|refresh
}

export function clearAuthCookie(): void {
  // no-op — cookies cleared by /v1/auth/logout
}
