# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**i9amati** is a property syndic management platform for the Moroccan residential market. It digitizes the full lifecycle of an إقامة (residence complex): registering apartments and owners, monthly fee collection, complaints, community feed, legal meetings, and service contracts. The primary user is the **Syndic** (property manager); owners and delegates have scoped views of the same data.

## Monorepo Structure

npm workspaces monorepo orchestrated by Turbo:

- `apps/api` — Express + Prisma + PostgreSQL REST API (port 4000)
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

API database commands (from repo root or `apps/api`):
```bash
npm --workspace apps/api run db:generate   # prisma generate
npm --workspace apps/api run db:migrate    # prisma migrate dev
npm --workspace apps/api run db:push       # prisma db push (no migration file)
npm --workspace apps/api run db:studio     # Prisma Studio UI
npm --workspace apps/api run db:seed       # run apps/api/src/prisma/seed.ts
```

Local PostgreSQL (Docker): `docker compose up -d postgres` — credentials: user/password, db: i9amati, port 5432.

## API Architecture

`apps/api/src/index.ts` mounts handlers on Express:
- `/api/auth/*` — Better Auth handler via `toNodeHandler(auth)` — sign-in, sign-up, session, 2FA, magic link, OTP
- `/api/residences` — residence CRUD
- `/api/apartments` — apartment CRUD
- `/health` — liveness probe

**Auth** (`src/auth.ts`): `betterAuth()` instance with plugins: `admin`, `twoFactor`, `emailOTP`, `magicLink`. User model has additional fields: `firstName`, `lastName`, `phone`, `platformRole`. Session has `activeOrganizationId` and `profileId`.

**Middleware** (`src/middleware/`):
- `auth.ts` — exports `authenticate` (validates Better Auth session, attaches `userId`, `platformRole`, `profileId`, `activeOrganizationId`, `session`, `user` to `AuthRequest`). `requirePermission` is defined here but not yet implemented — routes import it but permission enforcement is pending.
- `errorHandler.ts` — global error handler, `AppError(statusCode, message)` for known errors.

**Route pattern** for new domain routes:
```ts
router.use(authenticate)
router.get('/', async (req: Request, res, next) => {
  const { activeOrganizationId } = req as AuthRequest
  // always filter by activeOrganizationId for tenant isolation
})
```

## Prisma Schema

Single unified `apps/api/prisma/schema.prisma` — one Prisma client (`@prisma/client`).

**Better Auth tables**: `User`, `Session`, `Account`, `Verification`, `TwoFactor`.

**Organization layer**: `Organization`, `Profile` (user's identity within an org), `Invitation`.

**Domain models**: `ResidenceComplex`, `Residence`, `Building`, `Apartment`, `SharedFacility`, `ResidenceProfile`, `Payment`, `Complaint`, `Meeting`, `FeedPost`, `FeedComment`, `Document`.

Core entity graph:
```
Organization → Residence → Building → Apartment → Payment/Complaint
                       ↓
              ResidenceProfile (Profile × Residence × ProfileRole)
```

**`Profile`** (not `Member`) is the actor: `User → Profile → ResidenceProfile` where `ResidenceProfile` links a profile to a specific residence with a `ProfileRole` (SYNDIC/OWNER/TENANT/STAFF). A profile can hold multiple roles in the same residence (e.g. SYNDIC + OWNER) but not two of the same role.

**Tenant isolation**: row-level. Every `Residence` carries an `organizationId`. All domain queries filter via `where: { organizationId: activeOrganizationId }` or via a nested residence join — no schema-per-org provisioning.

## Roles & Permissions

`packages/shared/src/permissions.ts` exports two enums used across all apps:

```ts
enum PlatformRole { SUDO, USER }         // user.platformRole — platform-level
enum ProfileRole { SYNDIC, OWNER, TENANT, STAFF }  // ResidenceProfile.role — per-residence
```

Import as `import { PlatformRole, ProfileRole } from '@i9amati/shared'`.

Note: a Better Auth `organization` plugin with `createAccessControl` RBAC was planned but has not been implemented yet. Permission enforcement via `requirePermission` middleware is in progress.

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

`apps/web/src/App.tsx` — all routes nested under `/syndic` inside `<SyndicLayout>`, guarded by `<ProtectedRoute>` which calls `authClient.useSession()`.

**`SyndicLayout`** (`components/layout/SyndicLayout.tsx`): Fixed Sidebar + scrollable main area + floating `<ChatBot />` widget on every page.

**Page split**: each domain has two pages — a **dashboard** (`pages/syndic/dashboards/`) with analytics/Recharts, and a **management page** (`pages/syndic/`) with full CRUD UI. Route prefix `dash/` = dashboard variant (e.g. `/syndic/dash/payments` → `PaymentsDash.tsx`; `/syndic/payments` → `Payments.tsx`).

**Data**: `src/data/mock/` — the web app currently uses local mock data typed against `@i9amati/shared`. API integration is in progress; `@tanstack/react-query` is available for server state when connecting to the API.

**Path alias**: `@/` resolves to `apps/web/src/` (configured in `vite.config.ts`).

**UI stack**: shadcn-style components (Radix UI primitives + `class-variance-authority`) in `components/ui/`. Tailwind CSS + Framer Motion for layout/animation. Recharts for charts.

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
```

Web — `.env` in `apps/web/`:
```
VITE_API_URL=   # API base URL (default: http://localhost:4000)
```
