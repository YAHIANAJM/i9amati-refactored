# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**i9amati** is a property syndic management platform for the Moroccan residential market. It digitizes the full lifecycle of an إقامة (residence complex): registering apartments and owners, monthly fee collection, complaints, community feed, legal meetings, and service contracts. The primary user is the **Syndic** (property manager); owners and delegates have scoped views of the same data.

## Monorepo Structure

npm workspaces monorepo orchestrated by Turbo:

- `apps/api` - Express + Prisma + PostgreSQL REST API (port 4000)
- `apps/web` - React + Vite SPA (port 5173)
- `apps/mobile` - Expo / React Native
- `packages/shared` - TypeScript types and RBAC access-control config shared across all apps (imported as `@i9amati/shared`)

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
- `/api/auth/*` — Better Auth handler via `toNodeHandler(auth)` — sign-in, sign-up, session, organization, 2FA, magic link, OTP
- `/api/residences` — residence CRUD (active)
- `/api/apartments` — apartment CRUD (active)
- `/health` — liveness probe

**Auth** (`src/auth.ts`): `betterAuth()` instance with plugins: `organization`, `admin`, `twoFactor`, `emailOTP`, `magicLink`. The organization plugin uses `ac` and `organizationRoles` from `@i9amati/shared`. User model has additional fields: `firstName`, `lastName`, `phone`.

**Middleware** (`src/middleware/`):
- `auth.ts` — exports `authenticate` (validates Better Auth session, attaches `userId`, `userRole`, `activeOrganizationId` to `AuthRequest`) and `requirePermission(resource, action)` (calls `auth.api.hasPermission`). All domain routes use `router.use(authenticate)` then per-route `requirePermission`.
- `errorHandler.ts` — global error handler, `AppError(status, message)` for known errors.

**Route pattern** for new domain routes:
```ts
router.use(authenticate)
router.get('/', requirePermission('resource', 'read'), async (req: Request, res, next) => {
  const { activeOrganizationId } = req as AuthRequest
  // always filter by activeOrganizationId for tenant isolation
})
```

## Prisma Schema

Single unified `apps/api/prisma/schema.prisma` — one Prisma client (`@prisma/client`).

**Better Auth tables**: `User`, `Session`, `Account`, `Verification`, `Organization`, `Member`, `Invitation`, `TwoFactor`.

**Domain models**: `Residence`, `Building`, `Apartment`, `Payment`, `Complaint`, `Meeting`, `FeedPost`, `FeedComment`, `Document`.

Core entity graph: `Organization → Residence → Building → Apartment → Payment/Complaint`. `Member` (BA org membership) is the actor: a member can be a syndic of residences and owner/tenant of apartments.

**Tenant isolation**: row-level. Every `Residence` carries an `organizationId`. All domain queries filter via `where: { organizationId: activeOrganizationId }` or `where: { residence: { organizationId: activeOrganizationId } }` — no schema-per-org provisioning needed.

## Permissions (RBAC)

Defined in `packages/shared/src/permissions.ts` using Better Auth's `createAccessControl`. Resources: `residence`, `apartment`, `payment`, `complaint`, `meeting`, `feed_post`, `document`.

| Role | Capabilities |
|------|-------------|
| `admin` | Full CRUD on all resources |
| `syndic` | All except `residence:create/delete` |
| `owner` | Read most; create/update payments, complaints, feed_posts |
| `tenant` | Same as owner |
| `staff` | Read most; update complaints only |

Import as `import { ac, organizationRoles } from '@i9amati/shared'` — used identically on API (`src/auth.ts`) and web (`src/lib/auth-client.ts`).

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

**Auth client** (`src/lib/auth-client.ts`): `createAuthClient()` from `better-auth/react` with `organizationClient`, `twoFactorClient`, `magicLinkClient`, and `inferAdditionalFields` plugins. Points to `VITE_API_URL`.

## Design System

- Page background: `#d8dce3` — cards/panels are white, floating on the grey canvas
- Primary: `hsl(221 83% 53%)` / `#3b82f6`
- Sidebar: dark navy `hsl(222 47% 11%)`
- Status colors: emerald = paid/occupied, amber = pending/warning, red = overdue/urgent, slate = inactive/vacant
- Icons: Lucide React, stroke only, 16px default
- Avatars fallback: DiceBear `avataaars` style by gender
- Animations: Framer Motion, always check `prefers-reduced-motion`
- RTL support is planned; the UI is English-only during the current build phase

## Environment Variables

API — `.env` in `apps/api/`:
```
DATABASE_URL=              # PostgreSQL connection string
BETTER_AUTH_SECRET=        # Secret for Better Auth session signing (min 32 chars)
BETTER_AUTH_URL=           # Better Auth base URL (e.g. http://localhost:4000/api/auth)
BETTER_AUTH_TRUSTED_ORIGINS=  # Comma-separated allowed origins (e.g. http://localhost:5173)
GROQ_API_KEY=              # Groq API key for the chatbot
CLOUDINARY_CLOUD_NAME=     # Cloudinary for file uploads
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=                      # API port (default: 4000)
JWT_SECRET=                # Legacy JWT secret (unused with Better Auth)
```

Web — `.env` in `apps/web/`:
```
VITE_API_URL=   # API base URL (default: http://localhost:4000)
```