# NovaCore Frontend Architecture

## Overview

NovaCore frontend is a Next.js App Router application using a feature-first architecture. Shared infrastructure lives under `src/lib`, `src/providers`, `src/services`, and `src/components`. Feature modules live under `src/features/{feature}`.

## Folder Structure

```
src/
  app/                 # Routes, layouts, loading/error UI, SEO (robots/sitemap/manifest)
  components/
    auth/              # Route protection
    global/            # Error boundary, loaders, offline, skeletons
    layout/            # Skip-link shell
    pwa/               # Service worker registration + install prompt
    ui/                # Design system primitives
  constants/           # Routes, query keys, storage keys, app constants
  features/            # Feature modules (auth, dashboard, spaces, search, …)
  hooks/               # Shared hooks
  lib/                 # Query client and API client helpers
  providers/           # Global React providers
  services/            # Shared API clients (prefer feature `api/` for new work)
  store/               # Zustand stores
  styles/              # Global CSS and theme tokens
  types/               # Shared TypeScript types
  utils/               # Pure helpers
  middleware.ts        # Edge route protection
```

## Coding Standards

1. **TypeScript strict** — no `any`; prefer explicit interfaces.
2. **No hardcoded URLs** — use `env.NEXT_PUBLIC_API_URL`, `APP_URL`, and `ROUTES`.
3. **Single Axios instance** — `apiClient` from `@/services/api/client`.
4. **Server state in TanStack Query** — do not fetch API data in ad-hoc `useEffect`.
5. **Auth in Zustand** — use `useAuth()`, not prop drilling.
6. **Feature isolation** — share cross-feature contracts via `services`/`types`/`constants`.
7. **Accessibility** — labels, roles, keyboard support, focus management for dialogs/menus.
8. **Honest integrations** — do not invent backend APIs; use placeholders or local stores when the API is stubbed.

## Feature Status (honest mapping)

| Feature | Backend | Notes |
|---------|---------|--------|
| Auth / Profile | Real JWT + `/v1/users/me` | Avatar/sessions/2FA UI placeholders |
| Spaces | Real CRUD | Client-side filter/pagination helpers |
| Favorites | Real `favorite` flags | Pins may be local |
| Sharing | Local store | Backend sharing is stub-only |
| Notifications | Activity feed sync + local | No dedicated Notifications API |
| Analytics | Derived from dashboard/assets/spaces | Soft 10 GB quota is client-side |
| Search | Real `GET /v1/search` | Recent searches in localStorage |
| AI Assistant | Integration UI only | No fake completions |

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See also: [Performance](./PERFORMANCE.md), [Accessibility](./ACCESSIBILITY.md), [Deployment](./DEPLOYMENT.md), [Developer Guide](./DEVELOPER_GUIDE.md).
