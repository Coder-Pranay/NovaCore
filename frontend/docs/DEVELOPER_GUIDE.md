# Developer Guide

## Setup

```bash
cd frontend
cp .env.example .env.local   # if present
npm install
npm run dev
```

App: `http://localhost:3000` · API default: `http://localhost:8080/api`

Guest auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build (must pass) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (errors must be zero) |
| `npm run test:e2e` | Playwright end-to-end suite |

## Adding a feature page

1. Create `src/features/{name}/` with `api/`, `hooks/`, `components/`, `types/`.
2. Add query keys in `constants/query-keys.ts`.
3. Add route under `src/app/(private)/…` (thin page).
4. Register `ROUTES` + `PRIVATE_ROUTES` if needed.
5. Wire nav in `features/dashboard/utils/navigation.ts`.
6. Prefer existing UI primitives; add loading/error/empty states.

## Production polish checklist

- [ ] Page has loading skeleton and error retry
- [ ] Interactive controls are keyboard accessible
- [ ] No sensitive tokens logged to the console
- [ ] No invented API responses
- [ ] Theme tokens used (no one-off hard-coded colors when tokens exist)

## Related docs

- [Architecture](./FRONTEND_ARCHITECTURE.md)
- [Performance](./PERFORMANCE.md)
- [Accessibility](./ACCESSIBILITY.md)
- [Deployment](./DEPLOYMENT.md)
