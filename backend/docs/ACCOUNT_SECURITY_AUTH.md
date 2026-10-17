# Account security & session APIs

Cookie-authenticated endpoints under `/api/v1/auth`.

## Public (no access cookie)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/forgot-password` | Always generic success; stores SHA-256 reset token (default 30m) |
| POST | `/reset-password` | `{ token, password }` — invalidates token + all refresh sessions |
| POST | `/verify-email` | `{ token }` — marks `email_verified` |
| POST | `/resend-verification` | `{ email }` — rate-limited; generic success |

## Authenticated

| Method | Path | Notes |
|--------|------|--------|
| POST | `/change-password` | Current password required; revokes other sessions; activity log |
| GET | `/sessions` | Device, browser, IP, last active, `current` |
| DELETE | `/sessions/{id}` | Cannot revoke current session |
| POST | `/sessions/revoke-others` | Keeps current refresh cookie session |

## Configuration

```yaml
novacore.auth.require-email-verification: false  # block login until verified when true
novacore.auth.password-reset-token-expiration: 30m
novacore.auth.email-verification-token-expiration: 24h
novacore.auth.resend-verification-cooldown: 60s
novacore.auth.frontend-base-url: http://localhost:3000
novacore.auth.mail-from: noreply@novacore.local
spring.mail.host / port: MailHog on 1025 (UI :8025) in docker-compose
```

Tokens are never stored in plaintext. Dev mail: `docker compose` service `mailhog`.
