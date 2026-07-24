# Favorites Module

Sprint 9.7 — enterprise favorites for Spaces and Assets.

## Architecture

```
features/favorites/
  api/favorite-service.ts
  hooks/
  components/
  tables/
  types/
  schemas/
  utils/
  README.md
```

Route: `/favorites` (`app/(private)/favorites/page.tsx`)

## Backend alignment

There is no dedicated Favorites API. Favorites reuse:

| Action | API |
|--------|-----|
| List favorite spaces | `GET /v1/spaces` → filter `favorite === true` |
| List favorite assets | `GET /v1/assets` → filter `favorite === true` |
| Favorite / unfavorite space | `PUT /v1/spaces/{id}` with `favorite` |
| Favorite / unfavorite asset | `PUT /v1/assets/{id}` with `favorite` |

Pinned favorites are stored in `localStorage` (`novacore.favoritePins`) until a Pins API exists.

## Service

`favoriteService`

- `getFavorites(params)`
- `favorite(target)`
- `unfavorite(target)`
- `bulkFavorite(targets)`
- `bulkUnfavorite(targets)`
- `togglePin(itemId)`

## Hooks

- `useFavorites(params)`
- `useFavorite()` / `useFavoriteEntity()`
- `useToggleFavorite()`
- `useBulkFavorite()`
- `useToggleFavoritePin()`

Query keys: `QUERY_KEYS.favorites.*`

## UI

- Summary cards: recent, spaces, assets, pinned
- Desktop table + mobile cards
- Search, type filters, sort, pagination
- Bulk unfavorite / share
- Row actions: view, pin, share, unfavorite
- Share opens `ShareDialog` from the Sharing module

## Permissions

- Read: `spaces:read` or `assets:read`
- Write: `spaces:write` or `assets:write`

## Future integration

- Dedicated `GET /v1/favorites` with server pagination
- Server-side pins
- Deep-link to asset detail when Assets routes ship
- Activity events `FAVORITED` / `UNFAVORITED`
