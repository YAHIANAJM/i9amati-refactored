# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**i9amati** is a property syndic management platform for the Moroccan residential market. It digitizes the full lifecycle of an إقامة (residence complex): registering apartments and owners, monthly fee collection, complaints, community feed, legal meetings, and service contracts. The primary user is the **Syndic** (property manager); owners and delegates have scoped views of the same data.

## Monorepo Structure

npm workspaces monorepo with three packages:

- `apps/api` - Express + Prisma + PostgreSQL REST API (port 4000)
- `apps/web` - React + Vite SPA (port 5173)
- `apps/mobile` - Expo / React Native
- `packages/shared` - TypeScript types and RBAC access-control config shared across all apps (imported as `@i9amati/shared`)

## Commands

Run from the repo root:

```bash
npm run dev:web       # Start web app (Vite, port 5173)
npm run dev:api       # Start API with tsx watch (port 4000)
npm run dev:mobile    # Start Expo mobile app
npm run build:web     # TypeScript check + Vite build
npm run build:api     # TypeScript compile to dist/
```

Web-only:
```bash
npm --workspace apps/web run typecheck   # tsc --noEmit
```

API database commands (run from repo root or inside `apps/api`):
```bash
npm --workspace apps/api run db:generate   # prisma generate
npm --workspace apps/api run db:migrate    # prisma migrate dev
npm --workspace apps/api run db:push       # prisma db push (no migration file)
npm --workspace apps/api run db:studio     # Prisma Studio UI
npm --workspace apps/api run db:seed       # run apps/api/src/prisma/seed.ts
```

## API Architecture

`apps/api/src/index.ts` mounts handlers on Express. Currently active:
- `/api/auth/*` - Better Auth handler via `toNodeHandler(auth)` — all auth routes (sign-in, sign-up, session, organization, 2FA, magic link, OTP)
- `/health` - liveness probe

Domain route files exist in `src/routes/` but are commented out pending API integration (the web app uses mock data today).

**Auth** (`src/auth.ts`): `betterAuth()` instance with plugins: `organization`, `admin`, `twoFactor`, `emailOTP`, `magicLink`. The organization plugin uses the `ac` access-control object and `organizationRoles` from `@i9amati/shared`. Better Auth manages sessions, accounts, and member records in the database.

**Middleware** (`src/middleware/`): `auth.ts` for route protection, `errorHandler.ts` for global error handling.

## Prisma Schema

Single unified `apps/api/prisma/schema.prisma` — one Prisma client (`@prisma/client`).

**Better Auth tables**: `User`, `Session`, `Account`, `Verification`, `Organization`, `Member`, `Invitation`, `TwoFactor`.

**Domain models**: `Residence`, `Building`, `Apartment`, `Payment`, `Complaint`, `Meeting`, `FeedPost`, `FeedComment`, `Document`.

Core entity graph: `Organization → Residence → Building → Apartment → Payment/Complaint`. `Member` (BA org membership) is the actor: a member can be a syndic of residences and owner/tenant of apartments.

**Tenant isolation**: row-level. Every `Residence` carries an `organizationId`. All domain queries filter via `where: { residence: { organizationId: activeOrganizationId } }` — no schema-per-org provisioning needed.

## Permissions (RBAC)

Defined in `packages/shared/src/permissions.ts` using Better Auth's `createAccessControl`. Resources: `residence`, `apartment`, `payment`, `complaint`, `meeting`, `feed_post`, `document`. Roles: `admin` (full), `syndic` (manage but not create residences), `owner`/`tenant` (read + create own records), `staff` (read/update complaints only).

Import as `import { ac, organizationRoles } from '@i9amati/shared'` — used identically on both API (`src/auth.ts`) and web (`src/lib/auth-client.ts`).

## Chatbot Architecture (LangGraph + Groq + RAG)

The chatbot (`apps/api/src/chatbot/`) is a LangGraph state machine:

```
START → sanitize → safetyCheck → (conditional)
  → blocked: END
  → safe: retrieve → generate → outputGuard → END
```

- **Knowledge**: Hardcoded documents chunked with BM25-style retrieval (`knowledge/`)
- **Safety**: Input sanitizer (500 char max, HTML strip) → jailbreak detector (50+ patterns, severity scoring) → output guard — three independent layers
- **LLM**: Groq `llama-3.3-70b-versatile` via `@langchain/groq`, temperature 0.3, domain-locked system prompt
- Rate-limited: 10 req/min/IP

## Web App Architecture

`apps/web/src/App.tsx` — all routes are nested under `/syndic` inside `<SyndicLayout>`, guarded by `<ProtectedRoute>` which calls `authClient.useSession()`.

**`SyndicLayout`** (`components/layout/SyndicLayout.tsx`): Fixed Sidebar + scrollable main area + floating `<ChatBot />` widget on every page.

**Page split**: Each domain has two pages — a **dashboard** (`pages/syndic/dashboards/`) with analytics/charts, and a **management page** (`pages/syndic/`) with full CRUD UI. Example: `ApartmentsDash.tsx` (charts) vs the management pages like `Payments.tsx`, `Meetings.tsx`, etc.

**Mock data**: `src/data/mock/` — the web app currently uses local mock data, not the API. All data is typed against `@i9amati/shared`.

**Path alias**: `@/` resolves to `apps/web/src/` (configured in `vite.config.ts`).

**UI stack**: shadcn-style components (Radix UI primitives + `class-variance-authority`) in `components/ui/`. Tailwind CSS + Framer Motion for layout and animation. Recharts for charts.

**Auth client** (`src/lib/auth-client.ts`): `createAuthClient()` from `better-auth/react` with organization, twoFactor, and magicLink plugins. Points to `VITE_API_URL` (defaults to `http://localhost:4000`).

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
DATABASE_URL=       # PostgreSQL connection string
JWT_SECRET=         # JWT signing secret (legacy, may be unused with Better Auth)
CLIENT_URL=         # Web app origin for CORS
GROQ_API_KEY=       # Groq API key for the chatbot
BETTER_AUTH_SECRET= # Secret for Better Auth session signing
```

Web — `.env` in `apps/web/`:
```
VITE_API_URL=       # API base URL (default: http://localhost:4000)
```
