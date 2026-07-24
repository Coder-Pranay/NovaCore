# NovaCore Dashboard Module

Enterprise SaaS dashboard built on Sprint 9.1 foundation and Sprint 9.2 authentication.

## Architecture

```
features/dashboard/
  api/           # dashboardService (shared Axios client)
  hooks/         # TanStack Query hooks with shared cache
  components/    # StatCard, WidgetShell, Charts, DashboardPage
  widgets/       # Independent dashboard widgets
  layouts/       # AppShell, Sidebar, Topbar, Breadcrumbs, Mobile drawer
  types/         # Dashboard DTOs
  schemas/       # Zod shapes for response validation (optional use)
  utils/         # Chart builders, navigation config, storage helpers
```

## App Shell

`(private)/layout.tsx` wraps authenticated routes with:

- Collapsible left sidebar (role/permission aware)
- Sticky top bar (search shortcut, notifications, theme, user menu)
- Breadcrumbs
- Mobile navigation drawer

## Widgets

Each widget loads independently via React Query and supports loading, empty, error, and retry states.

| Widget | Data source |
|--------|-------------|
| Welcome Card | `GET /v1/dashboard` |
| Stats Cards | Dashboard summary |
| Recent Assets | `assets.recentUploads` |
| Recent Spaces | Derived from recent uploads |
| Recent Activity | `GET /v1/dashboard/activity` |
| Favorites Summary | `spaces.favoriteSpaces` |
| Storage Usage | Storage summary + soft quota |
| File Statistics | `statistics` distribution |
| Upload Statistics | Uploads grouped by day |
| Shared / Pinned | Empty placeholders (future sprints) |
| Quick Actions | Navigation-only placeholders |

## Hooks

```ts
useDashboard()
useStorageSummary()   // select from shared summary query
useRecentAssets()     // select from shared summary query
useRecentSpaces()     // select from shared summary query
useRecentActivity()   // separate activity query
```

Summary-derived hooks share `QUERY_KEYS.dashboard.summary` to avoid duplicate network calls.

## Services

```ts
dashboardService.getDashboardSummary()
dashboardService.getStorageSummary()
dashboardService.getRecentAssets()
dashboardService.getRecentSpaces()
dashboardService.getRecentActivity()
```

## Charts

Recharts charts are memoized and dynamically loaded (`ssr: false`):

- Storage usage (donut)
- Asset distribution (pie)
- Uploads over time (bar)

Theme tokens (`--chart-*`, `--popover`) keep charts readable in light and dark mode.

## Future Extension Points

- Real Spaces / Assets module deep links
- Favorites pin ordering
- Sharing feed for Shared Files widget
- Storage analytics quota from backend
- Notification center for bell badge counts
- Command palette for ⌘K search

## Integration Notes

Do not create a second Axios client. Extend `QUERY_KEYS.dashboard` for new widgets. Prefer `WidgetShell` + `StatCard` for consistency.
