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

Routes:

- `/shared` — authenticated sharing hub (`app/(private)/shared/page.tsx`)
- `/shared/link/[token]` — public landing with password gate

## Backend alignment

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/public-links` | JWT | Create public link (hashes password with BCrypt) |
| GET | `/v1/public-links` | JWT | List my public links |
| GET | `/v1/public-links/resource` | JWT | Active link for a resource |
| DELETE | `/v1/public-links/{id}` | JWT | Disable link |
| GET | `/v1/public-links/open/{token}` | Public | Preview only (`passwordRequired`, no content IDs) |
| POST | `/v1/public-links/open/{token}` | Public | Access content after password verification |

Email invites / permission grants remain **localStorage** until `/v1/shares` ships.

### Password security

- Plaintext passwords are never stored (client or server).
- Create sends password once; backend stores BCrypt hash only.
- Access returns **401** for invalid/missing password and **404** for unknown/disabled/expired shares.
- Preview never returns shared content; the UI cannot bypass the gate by reading local storage.

## Permissions model

- Viewer
- Commenter
- Editor
- Owner

Displayed via `PermissionBadge`.

## Service

`sharingService`

- Invite helpers still use local store
- `createPublicLink()` / `disablePublicLink()` / `getPublicLink()` → real API
- `previewPublicLink()` / `accessPublicLink()` → public open endpoints
- `getSharedItems()` merges API public links with local invites

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

- Invite by email + permission + expiration (local)
- People with access (update permission / remove)
- Generate / copy / disable public link (API)
- Real password protection (min 8 chars when enabled)

## Shared page

Tabs: All · Incoming · Outgoing · Pending · Expired · Public links

## Auth permissions

- `sharing:read` / `sharing:write` (added to USER + ADMIN maps)
- Falls back to `spaces:*` / `assets:*` for existing sessions

## Future integration

- Email delivery + accept invitation flow (`/v1/shares`)
- Wire Share into Spaces / Assets row actions when those modules land
- Notifications for invite / revoke events
