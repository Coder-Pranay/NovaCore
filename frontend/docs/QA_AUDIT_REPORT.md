# NovaCore Frontend QA Re-Audit Report

**Date:** 2026-07-25  
**Environment:** `next start` (fresh production build) + Spring Boot (`NOVACORE_REDIS_PORT=6380`)  
**E2E:** Playwright Chromium — **36/36 passed**

---

## Executive summary

| Gate | Result |
|------|--------|
| Playwright E2E | **PASS** 36/36 |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (0 errors, 9 warnings) |
| `npm run build` + `next start` | **PASS** |

### Prior critical fixes — verified

| Fix | Evidence |
|-----|----------|
| Register UI | `e2e/register.spec.ts` 5/5 |
| Share password protection | `e2e/share-password.spec.ts` 4/4 + API 401/200 checks |
| HttpOnly cookie auth (no localStorage JWTs) | `e2e/cookie-auth.spec.ts` 2/2 |

### Regression found & fixed during this audit

Unauthenticated session restore (`GET /v1/users/me` → 401) was forcing a hard redirect to `/login?next=…` on **guest** and **public** routes (`/register`, `/shared/link/*`). Fixed by:

- Guarding `redirectToLogin()` with `isGuestRoute` / `isPublicRoute`
- Bootstrapping session restore via raw axios (no interceptor bounce)

---

## PASS

| Area | Evidence |
|------|----------|
| Auth — login / logout / session reload | QA audit + cookie-auth E2E |
| Auth — register + validation + 409 | register E2E |
| Dashboard widgets load | QA audit |
| Spaces create + search smoke | QA audit |
| Search empty / min-length UX | QA audit |
| Sharing hub `/shared` | Module route E2E |
| Public share password gate | share-password E2E |
| Notifications / Settings / Profile / Analytics / Storage / AI | Module routes load, no page crash |
| Assets Coming Soon (HTTP &lt; 400) | QA audit |
| Dark theme toggle | QA audit |
| Protected routes redirect when logged out | QA audit |
| No JWTs in `localStorage` after login | cookie-auth E2E |

---

## FAIL

None remaining after the session-restore redirect fix.

---

## WARNING (non-blocking backlog)

| Issue | Severity | Notes |
|-------|----------|-------|
| Assets full library still Coming Soon | Medium | Honest placeholder; not a silent 404 |
| Email invites remain localStorage | Medium | Public links are API-backed |
| Notifications / AI local stores | Medium | AI correctly shows unavailable |
| Settings sessions / 2FA / API keys stubs | Medium | Hide or wire when APIs exist |
| Soft 10 GB quota client-side | Low | Label or move to backend |
| ESLint RHF / TanStack Table warnings | Low | 0 errors |
| Docker Redis host port **6380** | Ops | Set `NOVACORE_REDIS_PORT=6380` |
| Next 16 middleware → proxy warning | Low | Migrate when convenient |

---

## Module verification matrix

| Module | Status | Notes |
|--------|--------|-------|
| Authentication | Pass | Cookies + register |
| Dashboard | Pass | |
| Spaces | Pass | Create/search smoke |
| Search | Pass | Real `GET /v1/search` |
| Sharing | Pass | Password links E2E |
| Notifications | Pass (UI) | Local/activity-backed |
| Settings | Pass (UI) | Some stubs remain |
| AI | Pass (UI) | Unavailable state, no crash |

---

## Release readiness

**Score: 88 / 100**

**Decision: Ready for Production**

### Recommended future improvements (non-blocking)

1. Ship Assets library API + replace Coming Soon  
2. Backend `/v1/shares` for email invites (retire invite localStorage)  
3. Dedicated Notifications API; keep AI gated until model integration  
4. Harden settings: hide sessions/2FA/API keys until endpoints exist  
5. Align Redis port defaults or document `NOVACORE_REDIS_PORT=6380` in deploy runbooks  
6. Migrate Next middleware file to the proxy convention when upgrading  

---

## How to re-run

```powershell
docker compose -f docker/docker-compose.yml up -d
cd backend; $env:NOVACORE_REDIS_PORT="6380"; ./mvnw spring-boot:run
cd ../frontend; npm run build; npm run start
npx tsc --noEmit; npm run lint; npx playwright test --reporter=list
```
