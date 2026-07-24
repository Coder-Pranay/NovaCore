# NovaCore Authentication Module

Enterprise authentication for the NovaCore frontend, built on Sprint 9.1 foundation.

## Architecture

```
features/auth/
  api/           # authService (Axios via shared apiClient)
  components/    # Login UI + RequireAuth/Role/Permission guards
  hooks/         # TanStack Query mutations and session queries
  schemas/       # Zod validation (login, password flows)
  types/         # Auth DTOs
  utils/         # Authorization, cookies, token refresh, session restore
```

## Authentication Flow

1. User submits login form (React Hook Form + Zod)
2. `useLogin()` calls `authService.login()`
3. Tokens + user stored in Zustand (`setSession`)
4. Middleware cookie `novacore-authenticated` synchronized
5. Axios attaches `Authorization: Bearer {accessToken}`
6. On 401, queued refresh via `refreshSession()` then retry
7. Refresh failure clears session and redirects to `/login`

## Store

Zustand store (`src/store/auth-store.ts`) persists:

- `accessToken`
- `refreshToken`
- `user`
- `roles`
- `permissions`
- `rememberMe`

## Hooks

| Hook | Purpose |
|------|---------|
| `useLogin` | Sign in + redirect |
| `useLogout` | Revoke refresh token + clear session |
| `useRefresh` | Manual token refresh |
| `useCurrentUser` | Fetch `/v1/users/me` |
| `useForgotPassword` | Request reset email |
| `useResetPassword` | Complete reset with token |
| `useChangePassword` | Authenticated password change |

Re-exported from `@/hooks/use-auth`.

## API

Uses existing `apiClient` only.

| Method | Endpoint |
|--------|----------|
| login | `POST /v1/auth/login` |
| logout | `POST /v1/auth/logout` |
| refresh | `POST /v1/auth/refresh` |
| getCurrentUser | `GET /v1/users/me` |
| forgotPassword | `POST /v1/auth/forgot-password` *(ready when backend ships)* |
| resetPassword | `POST /v1/auth/reset-password` *(ready when backend ships)* |
| changePassword | `POST /v1/auth/change-password` *(ready when backend ships)* |

## Security

- Passwords never stored or logged
- Tokens persisted in localStorage + middleware cookie (not httpOnly yet)
- Safe redirect validation for `?next=` parameter
- Refresh request queue prevents infinite loops
- Skip refresh on auth endpoints

## Authorization Helpers

```typescript
hasRole(user, "ADMIN")
hasPermission(user, "dashboard:read")
canAccess(user, { roles: ["ADMIN"], permissions: ["settings:write"] })
```

## Protected Components

- `RequireAuth`
- `RequireRole`
- `RequirePermission`

## Future Extension Points

- OAuth / SSO provider buttons on login page
- httpOnly cookie token storage (backend coordination)
- MFA step-up authentication
- Registration flow (Sprint TBD)
- Permission sync from backend RBAC API
