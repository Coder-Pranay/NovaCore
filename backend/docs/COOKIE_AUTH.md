# Cookie authentication

NovaCore issues JWTs in **HttpOnly cookies**. Tokens are never returned in JSON bodies and must never be stored in `localStorage` or readable by JavaScript.

## Cookies

| Name | HttpOnly | Path | Purpose |
|------|----------|------|---------|
| `novacore_access` | yes | `/api` | Short-lived access JWT |
| `novacore_refresh` | yes | `/api/v1/auth` | Long-lived refresh JWT (rotated) |
| `novacore_session` | yes | `/` | Non-secret flag for Next.js middleware |

Attributes:

- `SameSite=Lax` (primary CSRF mitigation for cross-site POSTs)
- `Secure=true` in the `prod` profile (`NOVACORE_AUTH_COOKIE_SECURE`)

## Endpoints

| Method | Path | Cookies |
|--------|------|---------|
| POST | `/v1/auth/login` | Sets all three |
| POST | `/v1/auth/refresh` | Rotates access + refresh + session |
| POST | `/v1/auth/logout` | Clears cookies; revokes refresh hash in DB |

JSON responses contain `user` / `expiresIn` / `tokenType: "Cookie"` only — **no** `accessToken` / `refreshToken` fields.

## Request authentication

`JwtAuthenticationFilter` reads (in order):

1. `novacore_access` cookie
2. `Authorization: Bearer` (optional, for non-browser clients / tests)

CORS uses `allowCredentials=true` with explicit origins.

## CSRF

With `SameSite=Lax` cookies, classic cross-site form CSRF cannot attach the auth cookies on cross-site POSTs. The SPA and API share the `localhost` host in local development (port is not part of the cookie key). Double-submit CSRF tokens are not required for this architecture; re-evaluate if you ever set `SameSite=None` for a true cross-site deployment.

## Frontend

- Axios `withCredentials: true`
- Zustand holds **user profile only** (memory)
- Session restore: `GET /v1/users/me` → on 401, `POST /v1/auth/refresh` → retry `/me`
