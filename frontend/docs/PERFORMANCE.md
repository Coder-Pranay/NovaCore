# Performance

## Goals

- Fast first paint and route transitions
- Stable layouts (minimal CLS)
- Efficient React Query caching
- Lean client bundles for heavy modules

## Implemented practices

| Area | Approach |
|------|----------|
| Fonts | `next/font` Geist + Geist Mono with `display: "swap"` and preload |
| Package imports | `experimental.optimizePackageImports` for `lucide-react`, `recharts`, `date-fns` |
| Images | AVIF/WebP formats; remote patterns for local API host |
| Query cache | Default `staleTime` 60s, `gcTime` 5m, reconnect refetch, limited retries |
| Route loading | `loading.tsx` + `PageSkeleton` to reserve layout |
| Tables | Memoized column defs; sticky header; density/column toggles |
| Nav | `prefetch` on primary sidebar links |
| Search | Debounced query; `placeholderData` while paging; enabled only for ≥2 chars |
| Motion | `prefers-reduced-motion` hard-cut in global CSS |
| Compression | Next `compress: true`; `poweredByHeader: false` |

## Guidance for new pages

1. Prefer App Router segment boundaries over giant client pages.
2. Use `dynamic(() => import(...), { ssr: false })` only for truly heavy client-only charts/editors.
3. Memoize expensive list cell renderers when props are stable.
4. Keep query keys centralized in `QUERY_KEYS`.
5. Avoid duplicating server data into Zustand.

## Measurement

Run Lighthouse against a production build (`npm run build && npm start`) on `/login` and `/dashboard` after signing in. Targets for Sprint 9.13: Performance / Accessibility / Best Practices / SEO ≥ 95 where the page is primarily static shell content.
