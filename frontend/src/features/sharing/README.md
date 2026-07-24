# Sharing Module

Sprint 9.8 — enterprise sharing for Spaces and Assets.

## Architecture

```
features/sharing/
  api/sharing-service.ts
  api/sharing-store.ts
  hooks/
  components/
  dialogs/
  permissions/
  types/
  schemas/
  utils/
  README.md
```

Route: `/shared` (`app/(private)/shared/page.tsx`)

## Backend alignment

The backend `com.novacore.sharing` package is a stub. This module provides a **production-ready client** with local persistence (`localStorage` key `novacore.sharingStore`) so the product UI is complete and can later swap to REST without changing React Query hooks.

Documented future API shape (for backend Sprint):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/shares` | Invite user to space/asset |
| PATCH | `/v1/shares/{id}` | Update permission / expiration |
| DELETE | `/v1/shares/{id}` | Revoke access |
| GET | `/v1/shares` | List incoming/outgoing |
| POST | `/v1/public-links` | Create public link |
| DELETE | `/v1/public-links/{id}` | Disable public link |

## Permissions model

- Viewer
- Commenter
- Editor
- Owner

Displayed via `PermissionBadge`.

## Service

`sharingService`

- `shareSpace()` / `shareAsset()` / `shareResource()`
- `updatePermission()`
- `removeAccess()`
- `createPublicLink()`
- `disablePublicLink()`
- `getSharedUsers()`
- `getSharedItems()`
- `copyLink()`

## Hooks

- `useSharedItems(params)`
- `useSharedUsers(resource)`
- `usePublicLink(resource)`
- `useShare()`
- `useCreatePublicLink()`
- `useDisablePublicLink()`
- `useRemoveAccess()`
- `useUpdateSharePermission()`
- `useCopyShareLink()`

Query keys: `QUERY_KEYS.sharing.*`

## Share dialog

`ShareDialog` supports:

- Invite by email + permission + expiration
- People with access (update permission / remove)
- Generate / copy / disable public link
- Password placeholder (UI only)

## Shared page

Tabs: All · Incoming · Outgoing · Pending · Expired · Public links

Filters: permission, resource type, visibility, sort, search, pagination.

## Auth permissions

- `sharing:read` / `sharing:write` (added to USER + ADMIN maps)
- Falls back to `spaces:*` / `assets:*` for existing sessions

## Future integration

- Replace local store with Axios calls
- Email delivery + accept invitation flow
- Real public link landing page with password gate
- Wire Share into Spaces / Assets row actions when those modules land
- Notifications for invite / revoke events (Sprint 9.9)
