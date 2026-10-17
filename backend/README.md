# NovaCore Backend

Maven-based Spring Boot 3 API for NovaCore (Java 21).

## Prerequisites

- Java 21 JDK
- Docker Desktop (for PostgreSQL, Redis, MinIO)
- Maven Wrapper (`mvnw.cmd`)

## Infrastructure services

Start local dependencies from the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

| Service    | Port  | Credentials              |
|------------|-------|--------------------------|
| PostgreSQL | 5432  | `novacore` / `novacore`  |
| Redis      | 6380  | (no password)            |
| MinIO      | 9000  | `minioadmin` / `minioadmin` |
| MinIO UI   | 9001  | same as above            |
| MailHog    | 1025  | SMTP capture (UI: 8025)  |

## Run locally

```bash
cd backend
./mvnw.cmd spring-boot:run
```

API base URL: `http://localhost:8080/api`

Health check: `http://localhost:8080/api/actuator/health`

## Configuration

Copy environment defaults:

```bash
cp .env.example .env
```

Spring Boot loads `backend/.env` automatically when you run from the `backend/` directory.

Connection settings are driven by `NOVACORE_*` environment variables (see `.env.example`).

For production deployment, use `backend/.env.production.example` as a template for your secrets manager.

## Module packages

| Package | Responsibility |
|---------|----------------|
| `config` | Application and infrastructure configuration |
| `common` | Shared utilities and base types |
| `security` | Security primitives + HttpOnly auth cookies |
| `auth` | Login/register/refresh/logout with HttpOnly cookie JWTs |
| `users` | User profiles and accounts |
| `spaces` | Life Spaces |
| `assets` | Digital assets |
| `storage` | File storage orchestration |
| `search` | Universal search |
| `sharing` | Public links with BCrypt password protection; invite APIs TBD |
| `notifications` | Reminders and alerts |
| `activity` | Activity feed |
| `settings` | User settings |

## Tests

Requires infrastructure services to be running:

```bash
docker compose -f ../docker/docker-compose.yml up -d
./mvnw.cmd test
```
