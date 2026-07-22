# NovaCore Frontend Architecture

## Overview

NovaCore frontend is a Next.js App Router application using a feature-first scalable architecture. Shared infrastructure lives under `src/lib`, `src/providers`, `src/services`, and `src/components`. Feature-specific UI and hooks live under `src/features/{feature}`.

## Folder Structure

```
src/
  app/                 # Next.js routes and layouts
  components/
    auth/              # Route protection
    global/            # Error boundary, loaders, system views
    layout/            # App shell wrappers
    ui/                # Reusable design system components
  constants/           # Routes, query keys, storage keys, app constants
  features/            # Feature modules (dashboard, spaces, etc.)
  hooks/               # Shared hooks
  lib/                 # Query client and API client configuration
  providers/           # Global React providers
  services/            # API service layer (Axios)
  store/               # Zustand global stores
  styles/              # Global CSS and theme tokens
  types/               # Shared TypeScript types
  utils/               # Pure helper functions
  middleware.ts        # Edge route protection
```

## Coding Standards

1. **TypeScript strict mode** — no `any`; prefer explicit interfaces in `src/types`.
2. **No inline styles** — use Tailwind utility classes and design tokens from `globals.css`.
3. **No hardcoded URLs** — use `env.NEXT_PUBLIC_API_URL` and `ROUTES` constants.
4. **No hardcoded copy in services** — user-facing strings belong in components or a future i18n layer.
5. **Single Axios instance** — import `apiClient` from `@/services/api/client` only.
6. **Server state in TanStack Query** — do not fetch in `useEffect` for API data.
7. **Auth state in Zustand** — use `useAuth()` hook, not prop drilling.
8. **Composition over inheritance** — small composable UI primitives.
9. **Feature isolation** — feature components should not import from other features directly; share via `services` and `types`.
10. **Accessibility** — labels, roles, keyboard support, focus management for dialogs/forms.

## Adding a New Feature Module

Example: Dashboard (Sprint 9.x)

1. Create `src/features/dashboard/components/`.
2. Add API functions in `src/services/dashboard/` using `apiClient`.
3. Define query keys in `src/constants/query-keys.ts`.
4. Create hooks like `useDashboard()` with TanStack Query.
5. Add route under `src/app/(private)/dashboard/page.tsx`.
6. Register route in `PRIVATE_ROUTES` constant.
7. Build UI using components from `@/components/ui`.

## Authentication Flow (Future Sprint 9.2)

1. Login form calls `authService.login`.
2. On success, `useAuthStore.login(token, user)` persists session.
3. Set `novacore-authenticated` cookie for middleware (Sprint 9.2).
4. Axios interceptor attaches Bearer token automatically.
5. On 401, refresh token handler runs (pluggable); fallback clears auth and redirects to `/login`.

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Installed Libraries (Reserved)

- **Recharts** — dashboard/analytics charts (Sprint 9+)
- **TanStack Table** — data tables for assets/spaces lists
- **React Dropzone** — file upload UI (Assets module)

## Performance Guidelines

- Use `dynamic()` for heavy client-only modules.
- Prefer route-level code splitting via App Router segments.
- Memoize expensive list items when rendering large collections.
- Use TanStack Query caching instead of manual state duplication.
