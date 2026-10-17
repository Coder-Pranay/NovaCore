# NovaCore Authentication Module

Enterprise authentication for the NovaCore frontend.

## Architecture

```
features/auth/
  api/           # authService (Axios via shared apiClient, credentials: include)
  components/    # Login UI + RequireAuth/Role/Permission guards
  hooks/         # TanStack Query mutations and session queries
  schemas/       # Zod validation (login, password flows)
  types/         # Auth DTOs (no JWT fields)
  utils/         # Authorization, cookie-backed refresh, session restore
```

## Authentication Flow

1. User submits login form (React Hook Form + Zod)
2. `useLogin()` calls `authService.login()` with `withCredentials`
3. Backend sets HttpOnly cookies (`novacore_access`, `novacore_refresh`, `novacore_session`)
4. Zustand stores **user profile only** (in memory — never JWTs / localStorage)
5. Axios sends cookies automatically; no `Authorization` header from JS
6. On 401, queued `POST /v1/auth/refresh` (cookie) then retry
7. Refresh failure clears UI state and redirects to `/login`

## Store

Zustand (`src/store/auth-store.ts`) keeps ephemeral UI state:

- `user` / `roles` / `permissions`
- `isAuthenticated` / `isLoading` / `rememberMe`

JWTs are **not** in the store or `localStorage`.

## Hooks

| Hook | Purpose |
|------|---------|
| `useLogin` | Sign in + redirect |
| `useRegister` | Create account + redirect to login |
| `useLogout` | Clears cookies via API + UI state |
| `useRefresh` | Manual cookie refresh |
| `useCurrentUser` | Fetch `/v1/users/me` |
| `useForgotPassword` | Request reset email |
| `useResetPassword` | Complete reset with token |
| `useChangePassword` | Authenticated password change |

## Security

- Passwords never stored or logged
- HttpOnly + SameSite=Lax cookies (Secure in production)
- Middleware uses `novacore_session` presence (HttpOnly, Path=/)
- Safe redirect validation for `?next=`
- Refresh queue prevents storm loops
- See `backend/docs/COOKIE_AUTH.md`

## Authorization Helpers

```typescript
hasRole(user, "ADMIN")
hasPermission(user, "dashboard:read")
canAccess(user, { roles: ["ADMIN"], permissions: ["settings:write"] })
```
