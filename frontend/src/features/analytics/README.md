# Storage Analytics Module

Sprint 9.10 — storage analytics dashboard for NovaCore.

## Architecture

```
features/analytics/
  api/analytics-service.ts
  hooks/
  charts/
  widgets/
  components/
  types/
  schemas/
  utils/
  README.md
```

Routes:

- `/analytics` — primary
- `/storage` — alias (same page)

## Backend alignment

There is **no** dedicated Storage Analytics API.

Derived from existing endpoints only:

| Source | Use |
|--------|-----|
| `GET /v1/dashboard` | Storage totals, type statistics, recent uploads |
| `GET /v1/assets` | Largest files, per-space totals, trends by `createdAt` |
| `GET /v1/spaces` | Space names for largest-space ranking |

Soft quota remains **10 GB client-side** (`DEFAULT_STORAGE_QUOTA_BYTES`) until backend quotas ship.

Documented future API:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/analytics/storage` | Summary + quota |
| GET | `/v1/analytics/storage/trend` | Time series |
| GET | `/v1/analytics/largest-files` | Ranked files |
| GET | `/v1/analytics/largest-spaces` | Ranked spaces |
| GET | `/v1/analytics/uploads` | Upload trend |

## Service

`analyticsService`

- `getDashboard(range)`
- `getStorageSummary(range)`
- `getStorageTrend(range)`
- `getLargestFiles(range)`
- `getLargestSpaces(range)`
- `getUploadTrend(range)`

## Hooks

All share one React Query cache key for the selected range:

- `useStorageAnalytics`
- `useStorageSummary`
- `useStorageTrend`
- `useLargestFiles`
- `useLargestSpaces`
- `useUploadTrend`

## Charts (Recharts, lazy + theme-aware)

- Area — storage trend
- Line — growth trend
- Bar — uploads + space usage
- Pie / Donut — file type distribution

## Filters

Today · 7d · 30d · 90d · This year · Custom (placeholder → 30d)

## Permissions

Uses `dashboard:read` for nav visibility.
