# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**i9amati** is a property syndic management platform for the Moroccan residential market. It digitizes the full lifecycle of an إقامة (residence complex): registering apartments and owners, monthly fee collection, complaints, community feed, legal meetings, and service contracts. The primary user is the **Syndic** (property manager); owners and delegates have scoped views of the same data.

## Monorepo Structure

npm workspaces monorepo with three packages:

- `apps/api` - Express + Prisma + PostgreSQL REST API (port 4000)
- `apps/web` - React + Vite SPA (port 5173)
- `apps/mobile` - Expo / React Native
- `packages/shared` - TypeScript types shared between all apps (imported as `@i9amati/shared`)

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

API database commands (run from repo root or inside apps/api):
```bash
npm --workspace apps/api run db:generate   # prisma generate
npm --workspace apps/api run db:migrate    # prisma migrate dev
npm --workspace apps/api run db:push       # prisma db push (no migration file)
npm --workspace apps/api run db:studio     # Prisma Studio UI
npm --workspace apps/api run db:seed       # seed database
```

## API Architecture

`apps/api/src/index.ts` mounts all routers under `/api/*`. Routes:
- `/api/auth` - JWT auth (token via Bearer header or `token` cookie)
- `/api/residences`, `/api/apartments`, `/api/payments`, `/api/complaints`, `/api/meetings`, `/api/feed`, `/api/documents`
- `/api/chatbot` - AI assistant endpoint (POST, rate-limited 10 req/min/IP)

**Auth middleware** (`src/middleware/auth.ts`): `authenticate` extracts and verifies the JWT, attaches `req.userId` and `req.userRole`. `requireRole(...roles)` guards routes by `UserRole` enum (ADMIN, SYNDIC, OWNER, TENANT, STAFF).

**Prisma schema** is in `apps/api/prisma/schema.prisma`. The core entity graph: `User → Residence → Apartment → Payment/Complaint`. A `Residence` has one syndic (`User`) and many member `User`s.

## Chatbot Architecture (LangGraph + Groq + RAG)

The chatbot (`apps/api/src/chatbot/`) is a LangGraph state machine:

```
START → sanitize → safetyCheck → (conditional)
  → blocked: END
  → safe: retrieve → generate → outputGuard → END
```

- **Knowledge**: Hardcoded documents chunked with BM25-style retrieval (`knowledge/`)
- **Safety**: Input sanitizer (500 char max, HTML strip) → jailbreak detector (50+ patterns, severity scoring) → output guard - three independent layers
- **LLM**: Groq `llama-3.3-70b-versatile` via `@langchain/groq`, temperature 0.3, domain-locked system prompt
- **Env var required**: `GROQ_API_KEY`

## Web App Architecture

`apps/web/src/App.tsx` - all routes are nested under `/syndic` inside `<SyndicLayout>`.

**`SyndicLayout`** (`components/layout/SyndicLayout.tsx`): Fixed Sidebar + scrollable main area + floating `<ChatBot />` widget on every page.

**Page split**: Each domain has two pages - a **dashboard** (`pages/syndic/dashboards/`) with analytics/charts, and a **management page** (`pages/syndic/`) with full CRUD UI. Example: `ApartmentsDash.tsx` (charts) vs `Apartments.tsx` (table + forms).

**Mock data**: `src/data/mock/` - the web app currently uses local mock data, not the API. All data is typed against `@i9amati/shared`.

**Path alias**: `@/` resolves to `apps/web/src/` (configured in `vite.config.ts`).

**UI stack**: shadcn-style components (Radix UI primitives + `class-variance-authority`) in `components/ui/`. Tailwind CSS + Framer Motion for layout and animation. Recharts for charts.

## Design System (from DESIGN.md)

- Page background: `#d8dce3` - cards/panels are white, floating on the grey canvas
- Primary: `hsl(221 83% 53%)` / `#3b82f6`
- Sidebar: dark navy `hsl(222 47% 11%)`
- Status colors: emerald = paid/occupied, amber = pending/warning, red = overdue/urgent, slate = inactive/vacant
- Icons: Lucide React, stroke only, 16px default
- Avatars fallback: DiceBear `avataaars` style by gender
- Animations: Framer Motion, always check `prefers-reduced-motion`
- RTL support is planned; the UI is English-only during the current build phase

## Environment Variables

The API needs a `.env` file in `apps/api/`:
```
DATABASE_URL=       # PostgreSQL connection string
JWT_SECRET=         # JWT signing secret
CLIENT_URL=         # Web app origin for CORS
GROQ_API_KEY=       # Groq API key for the chatbot
```