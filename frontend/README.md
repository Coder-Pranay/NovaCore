# NovaCore Frontend

Next.js foundation for the NovaCore web application.

## Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod
- Axios

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

App URL: `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Folder structure

```text
src/
├── app/                 # Next.js App Router
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Global layout shell
│   └── providers/       # Theme, Query, Toast providers
├── config/              # Environment configuration
├── features/            # Feature modules (empty — not implemented yet)
├── hooks/               # Shared hooks
├── services/            # API client (no calls yet)
├── store/               # Zustand stores
├── styles/              # Global styles
├── types/               # Shared TypeScript types
└── utils/               # Utility functions
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | Backend API base URL |

## Status

Foundation only — no authentication, dashboard, or business logic implemented.
