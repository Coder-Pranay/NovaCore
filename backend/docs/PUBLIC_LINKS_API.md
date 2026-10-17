# Public share links API

Password-protected public links for Spaces and Assets.

## Security model

| Rule | Behavior |
|------|----------|
| Storage | BCrypt hash only (`password_hash`); never plaintext |
| Preview | `GET …/open/{token}` returns metadata only |
| Access | `POST …/open/{token}` verifies password before content |
| Invalid password | `401` + `"Invalid password"` |
| Invalid / disabled / expired share | `404` + `"Share not found"` |
| Timing | Dummy BCrypt compare when share missing or unprotected |

Owner endpoints require JWT. Open endpoints are `permitAll`.

## Owner endpoints

### Create

`POST /api/v1/public-links`

```json
{
  "resourceType": "SPACE",
  "resourceId": "uuid",
  "resourceName": "Health",
  "expiresAt": "2026-12-31T23:59:59Z",
  "passwordProtected": true,
  "password": "SharePass1!"
}
```

Response `201` — link metadata including `token`, `url`, `passwordProtected`. Never includes `password` or `passwordHash`.

### List / lookup / disable

- `GET /api/v1/public-links`
- `GET /api/v1/public-links/resource?resourceType=SPACE&resourceId={uuid}`
- `DELETE /api/v1/public-links/{id}`

## Public endpoints

### Preview

`GET /api/v1/public-links/open/{token}`

```json
{
  "success": true,
  "data": {
    "token": "…",
    "resourceType": "SPACE",
    "resourceName": "Health",
    "passwordRequired": true,
    "expiresAt": null
  }
}
```

### Access

`POST /api/v1/public-links/open/{token}`

```json
{ "password": "SharePass1!" }
```

Success `200` returns `resourceType`, `resourceId`, `resourceName`, `description`.

## Frontend

Landing page: `/shared/link/{token}` — prompts for password when `passwordRequired` is true.
