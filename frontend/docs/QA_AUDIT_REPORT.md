# NovaCore Frontend QA Audit Report

**Date:** 2026-07-24  
**Environment:** `next start` (production build) + Spring Boot (`NOVACORE_REDIS_PORT=6380`)  
**E2E:** Playwright Chromium — **25/25 passed** (`npm run test:e2e`)

Interactive summary: open the QA canvas beside chat.

---

## Executive summary

| Gate | Result |
|------|--------|
| Playwright E2E | **PASS** 25/25 |
| `npm run lint` | **PASS** (0 errors, 8 warnings) |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (middleware deprecation warning) |

---

## PASS

| Check | Evidence |
|-------|----------|
| Public routes render (`/`, `/login`, `/unauthorized`, `/offline`) | E2E |
| Unauthenticated access redirects to `/login?next=` | E2E |
| Invalid login → 401, stays on login | E2E + network |
| Empty login validation | E2E |
| Successful login → dashboard | E2E |
| Session persists across reload | E2E |
| Module routes load: dashboard, spaces, assets, favorites, shared, search, notifications, analytics, storage, settings, profile, ai | E2E (no page errors / no frontend 404) |
| Spaces create + search smoke | E2E |
| Search min-length / empty UX | E2E |
| Dark theme toggle | E2E |
| AI page loads without crash | E2E |
| `/assets` Coming Soon (HTTP &lt; 400) | E2E |
| `/shared/link/[token]` placeholder (HTTP &lt; 400) | E2E |
| Logout blocks `/dashboard` | E2E |
| Production build + TypeScript | local CI |

---

## FAIL

### 1. No Register UI
- **Severity:** Critical  
- **Root cause:** Backend `POST /v1/auth/register` exists; frontend has no `/register` route or link from login.  
- **File:** `frontend/src/features/auth/components/login-form.tsx`  
- **Line:** — (missing feature)  
- **Recommended fix:** Add register page + Zod schema + link on login.  
- **Auto-fixed:** No (product feature)

### 2. Share password protection is UI-only
- **Severity:** High  
- **Root cause:** Password field is labeled placeholder; value not enforced by service.  
- **File:** `frontend/src/features/sharing/dialogs/share-dialog.tsx`  
- **Line:** ~366–385  
- **Recommended fix:** Disable until backend public-link API; do not claim protection.  
- **Auto-fixed:** No (requires API contract)

### 3. Auth tokens in `localStorage`
- **Severity:** High  
- **Root cause:** XSS can steal access/refresh tokens.  
- **File:** `frontend/src/store/auth-store.ts`  
- **Line:** ~100–111  
- **Recommended fix:** httpOnly cookie session (backend + CORS + CSRF).  
- **Auto-fixed:** No (architectural)

---

## WARNING

| Issue | Severity | File | Line | Fix |
|-------|----------|------|------|-----|
| Assets full library missing (Coming Soon page only) | High | `app/(private)/assets/page.tsx` | 1+ | Sprint 9.5 |
| Sharing / Notifications / AI localStorage-only | High | `features/{sharing,notifications,ai}` | — | Honest copy + backlog APIs |
| Settings sessions / 2FA / API keys stubs | Medium | `features/settings` | — | Hide until APIs exist |
| Soft 10 GB quota client-side | Medium | `features/dashboard/utils/index.ts` | ~10–11 | Label or backend quota |
| Space restore unsupported in service | Medium | `features/spaces/api/space-service.ts` | ~90–94 | Wire API or remove UI |
| highContrast / compactMode unused | Medium | `features/settings/components/settings-page.tsx` | ~348–358 | Apply or remove |
| PWA SVG icons; `start_url=/dashboard` | Medium | `app/manifest.ts` | 10–28 | PNG icons; start at login |
| Next 16 middleware → proxy warning | Low | `src/middleware.ts` | 1 | Migrate when ready |
| ESLint RHF / TanStack Table compiler warnings | Low | multiple | — | Acceptable |
| Docker Redis on **6380** vs app default **6379** | High (ops) | `docker/docker-compose.yml` | — | Set `NOVACORE_REDIS_PORT=6380` |

---

## Safe fixes applied this session

1. `/shared/link/[token]` Coming Soon page (eliminates share-link 404)  
2. Service worker **v3** — network-first navigations (no stale HTML shell)  
3. Shared Files widget + space pins copy corrected  
4. `PageSkeleton` includes `#main-content` for skip-link  
5. Playwright suite + `npm run test:e2e` script  

---

## How to re-run

```powershell
# Infra
docker compose -f docker/docker-compose.yml up -d
$env:NOVACORE_REDIS_PORT="6380"

# Backend
cd backend; ./mvnw spring-boot:run

# Frontend prod
cd frontend; npm run build; npm run start

# E2E
cd frontend; npm run test:e2e
```
