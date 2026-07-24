# Deployment

## Prerequisites

- Node.js 20+
- Backend API reachable at `NEXT_PUBLIC_API_URL`
- Public site origin in `NEXT_PUBLIC_APP_URL` (used for metadata, sitemap, robots)

## Build

```bash
cd frontend
npm ci
npm run lint
npm run build
npm start
```

Production output is a standard Next.js standalone-capable build. Configure the process manager / container to set:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_APP_URL=https://app.example.com
```

## Docker (ready)

Use a multi-stage Dockerfile that runs `npm ci && npm run build` and starts `node server.js` (or `npm start`) with the env vars above. Do not bake secrets into the image; inject at runtime.

Security headers are applied in `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

## PWA

- Web app manifest from `src/app/manifest.ts`
- Icons under `public/icons/`
- Service worker scaffold at `public/sw.js` (shell cache + offline navigation fallback)
- Registration runs in production only via `PwaRegister`
- Install prompt UI listens for `beforeinstallprompt`

Offline sync is intentionally out of scope.

## SEO

- Root metadata / Open Graph / Twitter cards in `src/app/layout.tsx`
- `robots.ts` allows marketing/auth entry points; disallows authenticated app paths
- `sitemap.ts` lists public URLs only

## Health checks

- `GET /` or `GET /login` for the frontend container
- Confirm API CORS and cookie/JWT configuration match the deployed origins
