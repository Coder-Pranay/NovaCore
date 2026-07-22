# NovaCore

NovaCore is a Personal Digital Operating System that organizes a user's digital life using **Life Spaces**.

## Project Status

**Initialization phase** — project structure is scaffolded; business logic and features are not yet implemented.

## Repository Structure

```text
NovaCore/
├── backend/          # Java 21 + Spring Boot API
├── frontend/         # Next.js web application
├── docs/             # Product and architecture documentation
├── docker/           # Docker-related assets
├── infra/            # Infrastructure (Kubernetes, NGINX, etc.)
├── scripts/          # Development and utility scripts
└── .github/          # GitHub Actions workflows
```

## Tech Stack

### Backend

- Java 21
- Spring Boot 3
- Maven

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod
- Axios

## Prerequisites

- Java 21 JDK
- Maven 3.9+
- Node.js 20+
- npm 10+
- Docker (optional, for local services)

## Getting Started

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentation

See the [`docs/`](docs/) directory for product requirements, user personas, feature modules, and information architecture.

## License

See [LICENSE](LICENSE).
