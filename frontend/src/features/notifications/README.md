# Notifications Module

Sprint 9.9 — notification center for NovaCore.

## Architecture

```
features/notifications/
  api/notification-service.ts
  api/notification-store.ts
  hooks/
  components/
  dialogs/
  types/
  schemas/
  utils/
  README.md
```

Route: `/notifications`

Topbar: `NotificationBell` integrated in `AppTopbar`.

## Backend alignment

There is **no** Notifications API yet (`com.novacore.notifications` is a package stub).

This module:

1. Syncs from real `GET /v1/dashboard/activity` into a local inbox
2. Seeds a few system messages (announcement, storage warning, security)
3. Persists read/delete/preferences in `localStorage`

Documented future API:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/notifications` | Paginated inbox |
| POST | `/v1/notifications/{id}/read` | Mark read |
| POST | `/v1/notifications/read-all` | Mark all read |
| DELETE | `/v1/notifications/{id}` | Delete |
| GET/PUT | `/v1/notifications/preferences` | Preferences |

## Categories

Asset Uploaded · Asset Shared · Space Created · Space Updated · Permission Changed · Comment Added · Mention · Storage Warning · System Announcement · Security Alert

## Service

`notificationService`

- `getNotifications(params)`
- `markRead(id)`
- `markAllRead()`
- `deleteNotification(id)`
- `getPreferences()`
- `updatePreferences(prefs)`
- `getUnreadCount()`
- `syncFromActivity()`

## Hooks

- `useNotifications`
- `useUnreadCount`
- `useMarkRead` / `useMarkAllRead`
- `useDeleteNotification`
- `useNotificationPreferences` / `useUpdateNotificationPreferences`

## UI

- Bell dropdown with unread badge + preview
- Full page with date groups (Today / Yesterday / This Week / Older)
- Search, filter, sort, infinite scroll
- Detail drawer + preferences dialog

## Permissions

Uses existing `dashboard:read` for nav visibility.
