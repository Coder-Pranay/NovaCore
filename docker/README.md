# Docker

Local infrastructure for NovaCore development.

## Start services

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Services

| Service    | Host port | Default credentials        |
|------------|-----------|----------------------------|
| PostgreSQL | 5432      | `novacore` / `novacore`    |
| Redis      | 6380      | (no password)              |
| MinIO API  | 9000      | `minioadmin` / `minioadmin` |
| MinIO UI   | 9001      | same as above              |

The `minio-init` service creates the `novacore` bucket automatically.

## Redis note

If port `6379` is already in use on your machine, this compose file maps Redis to host port **6380**. Set `NOVACORE_REDIS_PORT=6380` when using the compose Redis container. If another Redis instance is already running on `6379`, the backend defaults to `localhost:6379`.

## Stop services

```bash
docker compose -f docker/docker-compose.yml down
```
