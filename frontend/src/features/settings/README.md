# Settings & Profile

Sprint 9.11 — account management for NovaCore.

## Architecture

```
features/settings/
  api/profile-service.ts
  api/settings-service.ts
  hooks/
  components/
  schemas/
  types/
  utils/
  README.md
```

Routes:

- `/profile`
- `/settings`
- `/settings/change-password` (existing auth form)

## Backend alignment

| Capability | Status |
|------------|--------|
| `GET /v1/users/me` | Real |
| `PUT /v1/users/me` | Real (`firstName`, `lastName`, `phoneNumber`) |
| Avatar upload | **Missing** — UI calls `profileService.uploadAvatar` → documents future `POST /v1/users/me/avatar` |
| Change password | UI exists; backend endpoint still pending |
| Sessions list / revoke others | **Missing** (JWT/stateless) — honest empty/error states |
| Preferences API | **Missing** — localStorage `novacore.userPreferences` |
| 2FA / API keys / connected accounts | Placeholders |

## Services

### `profileService`

- `getProfile()`
- `updateProfile(payload)`
- `uploadAvatar(file)` — integration point (throws until API ships)

### `settingsService`

- `getPreferences()` / `updatePreferences()`
- `getSessions()` / `logoutOtherSessions()` — throw controlled errors

## Hooks

- `useProfile` / `useUpdateProfile` / `useUploadAvatar`
- `usePreferences` / `useUpdatePreferences`

Query keys: `QUERY_KEYS.profile.*`, `QUERY_KEYS.preferences.*`

## Settings sections

General · Appearance · Security · Notifications · Sessions · Preferences · API Keys · Connected Accounts

Theme uses existing `next-themes` / `ThemeToggle`.
