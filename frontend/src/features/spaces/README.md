# Spaces Module

Enterprise workspace (Space) management for NovaCore — Sprint 9.4.

Spaces are top-level organizational containers for assets (Notion / Drive / Confluence style).

## Architecture

Feature-first under `features/spaces/`:

| Path | Role |
|------|------|
| `api/space-service.ts` | Axios service layer |
| `hooks/` | TanStack Query hooks |
| `components/` | List, detail, toolbar, cards, badges |
| `dialogs/` | Create / Edit / Archive / Delete / Restore |
| `tables/` | Desktop TanStack Table |
| `types/` | Space DTOs and list params |
| `schemas/` | Zod + React Hook Form validation |
| `utils/` | Client filter / sort / pagination helpers |

Routes:

- `/spaces` — list
- `/spaces/[id]` — detail

Private layout already wraps `RequireAuth` + `AppShell`.

## Backend alignment

Current Spaces API:

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/spaces` | Active (non-archived) spaces |
| `GET` | `/v1/spaces/{id}` | Owned space by id |
| `POST` | `/v1/spaces` | Create |
| `PUT` | `/v1/spaces/{id}` | Update (includes `favorite`) |
| `DELETE` | `/v1/spaces/{id}` | Soft archive only |

Honest UI mappings:

- **Visibility** — always **Private** until Sharing ships (Team / Public filters empty).
- **Members** — owner-only (`1`).
- **Assets / storage columns** — em dash on list; detail derives stats via `GET /v1/assets?spaceId=`.
- **Delete** — aliases archive (soft-delete).
- **Restore** — not supported; dialog explains API limit.
- **Search / filter / sort / pagination** — client-side over `getSpaces()`.

## Service

`spaceService`:

- `getSpaces()`
- `searchSpaces(params)`
- `getSpaceById(id)`
- `createSpace(payload)`
- `updateSpace(id, payload)`
- `archiveSpace(id)`
- `restoreSpace(id)` — throws controlled error
- `deleteSpace(id)` — archive alias
- `favoriteSpace(space, favorite)`
- `getSpaceStatistics(spaceId)`

## React Query

Query keys (`QUERY_KEYS.spaces`):

- `all` / `list(params)` / `detail(id)` / `search(query)` / `members(id)` / `statistics(id)`

Hooks:

- `useSpaces(params)`
- `useSpace(id)`
- `useSpaceStatistics(id)`
- `useCreateSpace()`
- `useUpdateSpace()`
- `useArchiveSpace()`
- `useRestoreSpace()`
- `useDeleteSpace()`
- `useFavoriteSpace()` (optimistic)
- `useBulkArchiveSpaces()` / `useBulkFavoriteSpaces()`

## Permissions

Uses existing auth helpers:

- `spaces:read` — view list / detail
- `spaces:write` — create, edit, favorite, archive, delete, bulk actions

Unauthorized actions are hidden; read-denied shows an error state.

## UI features

- Desktop table with column resize + multi-select
- Mobile card list
- Debounced search with highlight
- Filters: type, visibility, archived, favorites, created date, storage (placeholder)
- Sort: name, created, updated, assets, storage
- Pagination
- Empty / loading / error states (401–500 + network)
- Light / dark / system via existing theme toggle

## Detail sections

Overview · Members (placeholder) · Statistics · Recent assets · Activity · Storage summary · Pinned assets (placeholder)

## Future integrations

- Sprint 9.5 — Assets inside a space
- Sharing — Team / Public visibility + members
- Favorites module — dedicated favorites UX
- Restore / archived list API
- Server-side search, filter, sort, pagination
- Real storage quotas and per-row metrics

## Do not

This module intentionally does **not** implement Assets CRUD, Uploads, Sharing, or the Favorites module, and does not change Dashboard architecture.
