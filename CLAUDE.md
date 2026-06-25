# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**i9amati** is a property syndic management platform for the Moroccan residential market. It digitizes the full lifecycle of an إقامة (residence complex): registering apartments and owners, monthly fee collection, complaints, community feed, legal meetings, and service contracts. The primary user is the **Syndic** (property manager); owners and delegates have scoped views of the same data.

## Monorepo Structure

npm workspaces monorepo orchestrated by Turbo:

- `apps/api` — Express + Kysely + PostgreSQL REST API (port 4000)
- `apps/web` — React + Vite SPA (port 5173)
- `apps/mobile` — Expo / React Native
- `packages/shared` — TypeScript types and role enums shared across all apps (imported as `@i9amati/shared`)

## Commands

Primary dev command (starts PostgreSQL via Docker, then all apps via Turbo):
```bash
npm run dev
```

Individual app dev servers:
```bash
npm run dev:web       # Vite, port 5173
npm run dev:api       # tsx watch, port 4000
npm run dev:mobile    # Expo
npm run build:web     # tsc + Vite build
npm run build:api     # tsc to dist/
```

Type checking:
```bash
npm --workspace apps/web run typecheck   # tsc --noEmit
```

API database commands (from repo root):
```bash
npm --workspace apps/api run db:migrate:public          # migrate public schema
npm --workspace apps/api run db:migrate:tenant <slug>   # migrate one org's tenant schema
npm --workspace apps/api run db:migrate:all-tenants     # migrate every tenant schema
npm --workspace apps/api run db:seed                    # run seed.ts
```

Local PostgreSQL (Docker): `docker compose up -d postgres` — credentials: user/password, db: i9amati, port 5432.

## Database Architecture (Kysely + Schema-per-Tenant)

The API uses **Kysely** (not Prisma) with a raw `pg` connection pool. There is no ORM — all queries are typed via Kysely's query builder.

**Two-schema multi-tenancy**: every organization gets its own PostgreSQL schema named after the org's slug:
- `public` schema — Better Auth tables + org layer (`users`, `session`, `account`, `organizations`, `profiles`, `invitations`, …). Always queried with the `"public."` prefix.
- `<orgSlug>` schema — all domain tables (`residences`, `buildings`, `apartments`, `payments`, `meetings`, …). Queried via `db.withSchema(orgSlug)`, which is pre-scoped in `tenantDb` on every `AuthRequest`.

The single shared `db` instance lives in `apps/api/src/db/db.ts`. The `Database` interface with all table types is in `apps/api/src/db/types.ts`.

Migration files live in `apps/api/migrations/public/` and `apps/api/migrations/tenant/`. Adding a new domain table means writing a migration in `migrations/tenant/`.

## API Architecture

`apps/api/src/index.ts` mounts handlers on Express:
- `/api/auth/*` — Better Auth handler via `toNodeHandler(auth)` — sign-in, sign-up, session, 2FA, magic link, OTP
- `/api/setup` — initial org/residence onboarding after first login
- `/api/residences` — residence CRUD
- `/api/apartments` — apartment CRUD
- `/api/meetings` — meeting CRUD
- `/api/notifications` — notification list/read
- `/api/chatbot` — LangGraph chatbot endpoint
- `/health` — liveness probe

**Auth** (`src/auth.ts`): `betterAuth()` instance with plugins: `admin`, `twoFactor`, `emailOTP`, `magicLink`. Optional social providers (Google, Facebook) when their env vars are set. User model adds `firstName`, `lastName`, `phone`, `platformRole`, `verifiedAt`. Session adds `activeOrganizationId` and `profileId` (auto-populated on session create via `databaseHooks`).

**Middleware** (`src/middleware/`):
- `auth.ts` — exports `authenticate` (validates Better Auth session, looks up org slug, attaches `userId`, `platformRole`, `profileId`, `activeOrganizationId`, `orgSlug`, `session`, `user`, and `tenantDb` to `AuthRequest`). `requirePermission` is defined but not yet enforced — it's a no-op passthrough.
- `errorHandler.ts` — global error handler, `AppError(statusCode, message)` for known errors.

**Route pattern** for new domain routes:
```ts
router.use(authenticate)
router.get('/', async (req: Request, res, next) => {
  const { tenantDb, profileId, activeOrganizationId } = req as AuthRequest
  // tenantDb is already scoped to the org's schema via withSchema(orgSlug)
  // use tenantDb for all domain tables, db for public.* tables
})
```

## Roles & Permissions

`packages/shared/src/permissions.ts` exports two enums used across all apps:

```ts
enum PlatformRole { SUDO, USER }         // user.platformRole — platform-level
enum ProfileRole { SYNDIC, OWNER, TENANT, STAFF }  // profiles.role — per-org
```

Import as `import { PlatformRole, ProfileRole } from '@i9amati/shared'`.

Note: `requirePermission` middleware is a no-op stub — per-resource permission enforcement is not yet implemented.

## Chatbot Architecture (LangGraph + Groq + RAG)

The chatbot (`apps/api/src/chatbot/`) is a LangGraph state machine:

```
START → sanitize → safetyCheck → (conditional)
  → blocked: END
  → safe: retrieve → generate → outputGuard → END
```

- **Knowledge**: Hardcoded documents chunked with BM25-style retrieval (`knowledge/`)
- **Safety**: `safety/inputSanitizer.ts` (500 char max, HTML strip) → `safety/jailbreakDetector.ts` (50+ patterns, severity scoring) → `safety/outputGuard.ts` — three independent layers
- **LLM**: Groq `llama-3.3-70b-versatile` via `@langchain/groq`, temperature 0.3, domain-locked system prompt
- Rate-limited: 10 req/min/IP

## Web App Architecture

`apps/web/src/App.tsx` — all routes nested under `/syndic` inside `<SyndicLayout>`, guarded by `<ProtectedRoute>` which calls `authClient.useSession()`. Users without an `activeOrganizationId` in their session are redirected to `/auth/setup`.

**`SyndicLayout`** (`components/layout/SyndicLayout.tsx`): Fixed Sidebar + scrollable main area + floating `<ChatBot />` widget on every page.

**Page split**: each domain has two pages — a **dashboard** (`pages/syndic/dashboards/`) with analytics/Recharts, and a **management page** (`pages/syndic/`) with full CRUD UI. Route prefix `dash/` = dashboard variant (e.g. `/syndic/dash/payments` → `PaymentsDash.tsx`; `/syndic/payments` → `Payments.tsx`).

**Data**: `src/data/mock/` — the web app currently uses local mock data typed against `@i9amati/shared`. API integration is in progress; `@tanstack/react-query` is available for server state when connecting to the API.

**Path alias**: `@/` resolves to `apps/web/src/` (configured in `vite.config.ts`).

**UI stack**: shadcn-style components (Radix UI primitives + `class-variance-authority`) in `components/ui/`. Tailwind CSS + Framer Motion for layout/animation. Recharts for charts. Three.js / React Three Fiber for 3D elements.

**Auth client** (`src/lib/auth-client.ts`): `createAuthClient()` from `better-auth/react` with `twoFactorClient`, `magicLinkClient`, and `inferAdditionalFields` plugins. Points to `VITE_API_URL`.

## Design System

- Page background: `#d8dce3` — cards/panels are white, floating on the grey canvas
- Primary: `hsl(221 83% 53%)` / `#3b82f6`
- Sidebar: dark navy `hsl(222 47% 11%)`
- Status colors: emerald = paid/occupied, amber = pending/warning, red = overdue/urgent, slate = inactive/vacant
- Icons: Lucide React, stroke only, 16px default
- Avatars fallback: DiceBear `avataaars` style by gender (`seed=male` / `seed=female`)
- Animations: Framer Motion, always check `prefers-reduced-motion`
- RTL support is planned; UI is English-only during current build phase

## Environment Variables

API — `.env` in `apps/api/`:
```
DATABASE_URL=                   # PostgreSQL connection string
BETTER_AUTH_SECRET=             # Secret for Better Auth session signing (min 32 chars)
BETTER_AUTH_URL=                # Better Auth base URL (e.g. http://localhost:4000/api/auth)
BETTER_AUTH_TRUSTED_ORIGINS=    # Comma-separated allowed origins (e.g. http://localhost:5173)
GROQ_API_KEY=                   # Groq API key for the chatbot
CLOUDINARY_CLOUD_NAME=          # Cloudinary for file uploads
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=                           # API port (default: 4000)
# Optional social providers (omit to disable):
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

Web — `.env` in `apps/web/`:
```
VITE_API_URL=   # API base URL (default: http://localhost:4000)
```
