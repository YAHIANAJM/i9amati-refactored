# i9amati — Development Log

Platform: Property syndic management for Moroccan residential buildings (Loi 18-00).  
Stack: React 18 + TypeScript + Vite (web) · Express + Kysely + PostgreSQL (API) · Better Auth v1.6.19 · TanStack Query v5 · Framer Motion.  
Architecture: npm workspaces monorepo (Turbo) · multi-tenant PostgreSQL (one schema per organisation slug).

---

## Session — Meetings Module + VPS Prep (2026-06-21)

### 1. Meetings.tsx — full React Query integration

**Problem:** `Meetings.tsx` was driven by local `useState<Meeting[]>(mockMeetings)`. Every mutation (start meeting, cast vote, toggle presence…) only updated in-memory state and was lost on refresh.

**Solution:** Complete rewrite of the component using `@tanstack/react-query`.

| Hook | Purpose |
|------|---------|
| `useMeetings()` | `useQuery` — `GET /api/meetings` |
| `useMeetingMutations()` | `useMutation` × 9 — start, close, togglePresence, openVote, castVote (+ optimistic update), closeVote, presidentDecide, sendConvocation, createMeeting |

All mutations call `invalidateQueries(['meetings'])` on success to keep the list fresh. `castVote` additionally does a client-side optimistic update (snapshot → apply → rollback on error) so the vote bar animates instantly without waiting for the server round-trip.

**Key files:**
- `apps/web/src/pages/syndic/Meetings.tsx` — complete rewrite
- `apps/web/src/lib/api.ts` — thin `fetch` wrapper (`api.get / post / patch / delete`)
- `apps/web/src/main.tsx` — wrapped in `QueryClientProvider` with `staleTime: 30_000`

---

### 2. Windows ESM URL scheme error in migrations

**Error:** `ERR_UNSUPPORTED_ESM_URL_SCHEME` — Node's ESM loader rejected `D:\...` as a URL scheme when `FileMigrationProvider` called `import('D:\\...')`.

**Root cause:** Node.js ESM `import()` requires a `file://` URL on Windows. Absolute Windows paths (`D:\`) are treated as URL schemes and rejected.

**Fix:** Created `WindowsSafeMigrationProvider` in both `provisionTenant.ts` and `migrate.mts`. Wraps each path with `pathToFileURL(path.join(folder, file)).href` before calling `import()`.

```ts
const fileUrl = pathToFileURL(path.join(this.folder, file)).href
const mod = await import(fileUrl)
```

**Files changed:**
- `apps/api/src/db/provisionTenant.ts`
- `apps/api/src/db/migrate.mts`

---

### 3. Raw SQL ignoring `withSchema` in tenant migrations

**Error:** `la relation "meetings_members" n'existe pas` — PostgreSQL looked in `public` schema, not the tenant schema.

**Root cause:** `db.withSchema('residence-atlas')` only qualifies Kysely *builder* queries. Raw `sql\`...\`.execute(db)` calls use the connection's default `search_path = public` and never touch the tenant schema.

**Fix:** In `provisionTenant.ts`, create a dedicated `pg.Pool` with the tenant schema baked into the connection string via `options`:

```ts
const searchPath = `-c%20search_path%3D%22${encodeURIComponent(orgSlug)}%22%2Cpublic`
const tenantConnStr = `${DATABASE_URL}${sep}options=${searchPath}`
const tenantPool = new Pool({ connectionString: tenantConnStr })
```

Every connection from this pool automatically resolves unqualified table names to the tenant schema. Pool is destroyed after migration completes.

**Files changed:** `apps/api/src/db/provisionTenant.ts`

---

### 4. 401 Unauthorized on `/api/meetings`

**Error:** `POST /api/auth/sign-in` succeeds but every subsequent API call returns 401.

**Root cause:** Better Auth creates sessions with `activeOrganizationId: null` and `profileId: null` — custom session fields are not auto-populated on login. The `authenticate` middleware returned 401 when these were missing.

**Fix:** Added `databaseHooks.session.create.before` in `auth.ts`. Runs before every new session is written to the DB; queries `public.profiles` by `userId` and injects the org + profile IDs:

```ts
databaseHooks: {
  session: {
    create: {
      before: async (session) => {
        const profile = await db
          .selectFrom('public.profiles')
          .select(['id', 'organization_id'])
          .where('user_id', '=', session.userId)
          .executeTakeFirst()
        if (!profile) return
        return { data: { ...session, activeOrganizationId: profile.organization_id, profileId: profile.id } }
      },
    },
  },
},
```

> **Note:** Existing sessions created before this fix do not have the fields set. Users must log out and back in once to get a new session.

**Files changed:** `apps/api/src/auth.ts`

---

### 5. Meetings API — backend routes

Complete REST API in `apps/api/src/routes/meetings.ts`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/meetings` | All meetings with agenda + attendees |
| `GET` | `/api/meetings/:id` | Single meeting |
| `POST` | `/api/meetings` | Create meeting + agenda items |
| `PATCH` | `/api/meetings/:id/start` | SCHEDULED → IN_PROGRESS |
| `PATCH` | `/api/meetings/:id/close` | IN_PROGRESS → COMPLETED (requires all votes closed) |
| `PATCH` | `/api/meetings/:id/attendees/:aid/presence` | Toggle physical presence |
| `POST` | `/api/meetings/:id/agenda/:itemId/open` | PENDING → OPEN (quorum check for 1ère convocation) |
| `POST` | `/api/meetings/:id/agenda/:itemId/cast` | Increment pour/contre/abstention |
| `POST` | `/api/meetings/:id/agenda/:itemId/close` | OPEN → CLOSED (auto-detect tie) |
| `POST` | `/api/meetings/:id/agenda/:itemId/president` | Resolve tie via voix prépondérante |
| `PATCH` | `/api/meetings/:id/send-convocation` | Mark convocation as sent |

**Loi 18-00 enforcement:**
- 1ère convocation: quorum ≥ 50% required to open votes (enforced server-side on `/open`)
- 2ème convocation: deliberates regardless of attendance (quorum check skipped)
- Tie (pour === contre after close): `result` stays `null`, UI shows voix prépondérante panel, `/president` endpoint resolves it
- Meeting can only close when all agenda items have a non-null `result`

---

### 6. Physical presence system (pointage)

**Motivation:** Pre-meeting RSVPs (accepted/declined from member profiles) are insufficient for Loi 18-00 quorum calculation. What matters legally is who is physically present in the room at the time of voting.

**Implementation:**
- `meeting_attendees.present` (boolean, default `false`) — represents physical presence
- `meeting_attendees.rsvp` — represents the pre-meeting convocation response
- During `IN_PROGRESS`, the syndic sees a pointage grid and toggles each person's physical presence
- Quorum is calculated only from `present: true` attendees
- Votes cannot be opened until quorum is reached (1ère convocation) — enforced both in the UI and on the server

---

### 7. Tenant migration 003 — convocation + building

Added `apps/api/migrations/tenant/003_convocation_sent.ts`:
- `meetings.convocation_sent_at timestamptz` — timestamp of when convocation email was sent; null = not sent
- `meetings.building_id varchar` — FK to `buildings.id` (nullable) — scopes meeting to a specific building within a residence

---

### 8. CreateMeetingDrawer — residence & building selectors

When creating a new meeting:
1. **Résidence** dropdown — fetched live from `GET /api/residences`
2. **Bâtiment** dropdown — appears after a residence is selected, fetched from `GET /api/residences/:id` (which embeds `{ buildings: [...] }`)
3. "Toute la résidence" = leave buildingId empty
4. `residenceId` + `buildingId` are sent to `POST /api/meetings`

**Scope labels on meeting cards:** `2ème convocation` badge, `Convocation envoyée` badge (green, with mail icon) when `convocationSentAt` is set.

---

### 9. ConvocationModal — Envoyer convocation

Clicking "Envoyer convocation" opens a confirmation modal that:
- Shows meeting summary (title, type, date, location)
- Lists all recipients with initials avatar + apartment
- On confirm: calls `PATCH /api/meetings/:id/send-convocation` → sets `convocation_sent_at`
- After success: the button is replaced by a static "Convocation envoyée ✓" badge (cannot be re-sent)

---

### 10. TopBar — notification panel + settings navigation

**Bell icon:** Opens an animated slide-down `NotificationPanel` (Framer Motion) showing typed notifications (PAYMENT, MEETING, COMPLAINT, DOCUMENT). Each has an icon + colour chip. Unread badge count on the bell. "Tout lire" marks all read; individual clicks mark one read.

**Settings2 icon:** `useNavigate('/syndic/settings')` — routes to the Profile page.

---

### 11. PV print fix

**Problem:** `window.print()` printed the entire page (sidebar, TopBar, meeting list).

**Fix:** CSS `@media print` approach:
```css
@media print {
  * { visibility: hidden !important; }
  .pv-print-area, .pv-print-area * { visibility: visible !important; }
  .pv-print-area { position: fixed; top: 0; left: 0; width: 100%; background: white; padding: 32px; }
  .pv-no-print { display: none !important; }
  @page { margin: 16mm; }
}
```

The PV content is wrapped in `<div className="pv-print-area">` and the Close/Print buttons are in `<div className="pv-no-print">`. Using `visibility` (not `display`) means the layout engine still renders the hidden elements, but only the print area is shown on paper. Works correctly with Radix UI portal-mounted dialogs.

**Files changed:**
- `apps/web/src/index.css` — `@media print` block
- `apps/web/src/pages/syndic/Meetings.tsx` — `pv-print-area` + `pv-no-print` divs in `PVModal`

---

### 12. VPS deployment preparation (Hostinger)

**Architecture on VPS:**
```
Internet → nginx (443) ─┬─ proxy → Node.js :4000   (API)
                        └─ static files             (React SPA)
PostgreSQL :5432 (local, not exposed)
PM2 — process manager for Node.js
```

**Files created:**

| File | Purpose |
|------|---------|
| `apps/api/.env.production.example` | Production env template — copy to `.env`, fill values |
| `apps/api/ecosystem.config.cjs` | PM2 config — process name, log paths, memory limit, auto-restart |
| `deploy/nginx.conf` | Nginx vhost — API reverse proxy + SPA static serving + SSL headers |
| `deploy/setup.sh` | One-time VPS bootstrap — Node, PM2, PostgreSQL, certbot, UFW |
| `deploy/deploy.sh` | Re-deploy script — git pull → build → migrate → pm2 restart |

**TypeScript build changes:**

`apps/api/tsconfig.json` — changed `rootDir` from `"./src"` to `"."` and added `"migrations/**/*"` to `include`. This compiles migrations alongside `src`:
- `src/index.ts` → `dist/src/index.js`
- `migrations/tenant/001_initial.ts` → `dist/migrations/tenant/001_initial.js`

The `provisionTenant.ts` path `path.join(__dirname, '../../migrations/tenant')` resolves correctly in both environments:
- Dev (`src/db/`): `../../migrations/tenant` → `apps/api/migrations/tenant/` (raw `.ts` files, loaded via `tsx`)
- Prod (`dist/src/db/`): `../../migrations/tenant` → `apps/api/dist/migrations/tenant/` (compiled `.js` files)

`apps/api/package.json` updated:
- `"start"` → `node dist/src/index.js` (was `node dist/index.js`)
- Added `db:migrate:public:prod` and `db:migrate:tenant:prod` scripts using compiled `.mjs`

`apps/api/src/index.ts` — added `app.set('trust proxy', 1)` in production so `req.ip` and secure session cookies work correctly behind nginx.

**Deploy checklist:**
1. SSH into VPS, run `bash deploy/setup.sh` once
2. Copy `apps/api/.env.production.example` → `apps/api/.env`, fill all values
3. In `apps/web/.env.production`: set `VITE_API_URL=https://api.yourdomain.com`
4. Run `bash deploy/deploy.sh` for every update
5. For each new organisation (tenant): `npm --workspace apps/api run db:migrate:tenant:prod <org-slug>`

---

## Database Schema Summary

```
public schema (Better Auth + org layer)
├── users, session, account, verification, twoFactor
├── organizations   (id, name, slug)
├── profiles        (id, user_id, organization_id, role)
└── invitations

<org-slug> schema (tenant — one per organisation)
├── residences      (name, address, city, ...)
├── buildings       (residence_id, floors, has_elevator, ...)
├── apartments      (building_id, unit_code, owner_profile_id, ...)
├── payments        (apartment_id, amount, status, due_date, ...)
├── complaints      (apartment_id, title, priority, status, ...)
├── meetings        (title, type, status, convocation_number, building_id, convocation_sent_at, ...)
├── agenda_items    (meeting_id, title, vote_status, pour, contre, abstention, result, ...)
├── meeting_attendees (meeting_id, name, apartment, rsvp, present, ...)
├── groups, feed_posts, feed_comments
├── documents, document_access
├── services, service_contracts, service_schedules
└── notifications
```

---

## Known Issues / Next Steps

- **Existing sessions after auth fix:** Users logged in before the `databaseHooks` fix must log out and back in to get `activeOrganizationId` + `profileId` injected into their session.
- **Tenant provisioning:** If the seed fails partway (partial schema), drop the schema with `DROP SCHEMA IF EXISTS "residence-atlas" CASCADE;` then re-run `npm --workspace apps/api run db:seed`.
- **Email sending:** `sendConvocation` marks the meeting as sent but does NOT send actual emails. Nodemailer is installed — wire up SMTP in a future session.
- **Notification panel:** Currently shows static demo data. Wire to `GET /api/notifications` in a future session.
- **Mobile app:** `apps/mobile` (Expo) shares types via `@i9amati/shared` but has no screens yet.
- **Permission enforcement:** `requirePermission` middleware is defined but not yet applied to routes.
