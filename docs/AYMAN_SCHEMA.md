# Ayman — Task Schema

> Reference for each assigned task: what already exists, what the backend exposes,
> what needs to be built. Check this before writing any new code to avoid duplication.

---

## Task Order (logical dependency)

```
1. Login / Registration      ← gate to the app, partially done
2. Home Page                 ← public-facing, partially done
3. Meetings & Voting         ← core legal feature, biggest remaining task
4. Union Members             ← simpler data management
5. Meetings Analytics Dash   ← already drafted, needs review/polish
6. Union Analytics Dash      ← already drafted, needs review/polish
```

> **Accounting is NOT Ayman's task.** Removed.

---

## 1. Login / Registration ✅ Done

**Tracker status**: ✅ Done

### What already exists

| Layer | File | State |
|-------|------|-------|
| Frontend | `apps/web/src/pages/auth/Login.tsx` | ✅ Functional — Better Auth `signIn.email`, error handling, redirects to `/syndic` |
| Backend | `/api/auth/*` via Better Auth | ✅ Done — `signIn`, `signUp`, session, 2FA, emailOTP, magicLink all mounted |
| Route guard | `App.tsx → ProtectedRoute` | ✅ Done — `authClient.useSession()`, redirects to `/auth/login` if no session |

### What is missing

- **Registration page** — no `/auth/register` route or page exists yet. The old codebase had a full `ResidenceSetup.jsx` wizard (building info → invite owners). In the refactored app, sign-up goes through Better Auth `signUp.email`, then an org/residence onboarding step is needed.
- **Login branding** — current Login card is a plain generic form. Needs i9amati logo, brand color, Arabic/French label (`تسجيل الدخول`).
- **Forgot password / magic link** — Better Auth has `magicLinkClient` and `emailOTP` plugins ready; the UI entry point is missing.
- **Role-based redirect after login** — after `signIn.email` succeeds, the app always goes to `/syndic`. When owner and staff roles are added, the redirect should check `session.user.role` or `ProfileRole` and branch accordingly.

### Old logic to reference
`i9amati-front-end/src/pages/Login.jsx` — multi-step with role detection  
`i9amati-front-end/src/pages/ResidenceSetup.jsx` — onboarding wizard for new syndic  
`i9amati-front-end/src/contexts/AuthContext.jsx` — JWT decode + role storage

### Do NOT rebuild
- The Better Auth backend (`apps/api/src/auth.ts`) — already configured, do not touch.
- `ProtectedRoute` in `App.tsx` — already works, do not duplicate.

---

## 2. Home Page

**Tracker status**: 🔄 In Progress

### What already exists

| Layer | File | State |
|-------|------|-------|
| Route | `App.tsx` line 1 | `/` → `<Navigate to="/syndic" replace />` — no real home page |
| Design direction | `PRODUCT.md` | Brand personality defined: Reliable, Clear, Human |

### What is missing

The home page is a **public marketing/landing page** — visible before login. It doesn't exist yet. The root `/` currently just redirects to the syndic dashboard.

- Create `apps/web/src/pages/Home.tsx`
- Add `<Route path="/" element={<Home />} />` in `App.tsx` (replace the Navigate)
- Content: hero headline, product value proposition, 3–4 feature bullets, CTA → `/auth/login`
- No backend needed — fully static

### Old logic to reference
`i9amati-front-end/src/pages/Homepage.jsx` — has the full layout structure to adapt

### Do NOT rebuild
- Sidebar, TopBar, SyndicLayout — these are inside the app shell, not the landing page. The home page is outside `<SyndicLayout>`.

---

## 3. Meetings & Voting

**Tracker status**: ⬜ Not Started

### What already exists

#### Frontend
| File | State |
|------|-------|
| `apps/web/src/pages/syndic/Meetings.tsx` | ✅ Read-only card list — shows mock meetings with date block, status badge, location, attendee count, "Envoyer convocation" button |
| `apps/web/src/data/mock/meetings.ts` | ✅ Mock data typed against Meeting shape |

The list page is a **solid base** — do not rewrite it.

#### Backend — DB schema
| Table | Fields | State |
|-------|--------|-------|
| `meetings` | `id, title, description, status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED), type (GLOBAL/EXCEPTIONAL/NORMAL), scheduled_at, location, agenda (JSON), timestamps` | ✅ Exists in Kysely types |
| `meetings_members` | `id, meeting_id, member_id` | ✅ Exists |

#### Backend — API routes
| Route | State |
|-------|-------|
| `GET /api/meetings` | ❌ Does not exist in refactored API |
| `POST /api/meetings` | ❌ Does not exist |
| Any voting routes | ❌ No `votes` or `vote_results` tables in refactored DB |

> The old backend (`i9amati-back-end/routes/voting.js`) has: `getMeetings`, `createMeeting`, `updateMeeting`, `deleteMeeting`, `submitVote`, `getMeetingResults`, `getEligibleVoters`. Use this as logic reference only — the refactored API uses **Kysely + PostgreSQL**, not Mongoose.

### What is missing

**Frontend** (build on top of existing `Meetings.tsx`):
- "Planifier une réunion" button → modal/drawer form (title, type, date, location, agenda items list)
- Agenda items as a dynamic list (add/remove rows: `{ title: string, description?: string }`)
- Meeting detail view — click a meeting → shows full agenda + attendee list + quorum status
- Voting UI per agenda item: Pour / Contre / Abstention buttons + live tally
- Quorum indicator: show % of co-owner tantièmes present vs. required threshold
- "Clôturer la réunion" action → generates PV summary view (read-only printable)
- "Envoyer convocation" button → triggers notification (can be mock for now)

**Backend** (new routes needed in `apps/api/src/routes/`):
- `GET  /api/meetings` — list meetings for org, filter by status/type
- `POST /api/meetings` — create meeting with agenda JSON
- `PUT  /api/meetings/:id` — update status, location, etc.
- `POST /api/meetings/:id/members` — add attendee
- Voting: need to add `vote_options` and `vote_results` tables to the tenant schema migration (they don't exist yet), then routes for `POST /api/meetings/:id/votes` and `GET /api/meetings/:id/results`

### Old logic to reference
`i9amati-front-end/src/pages/Meetings.jsx` — full CRUD + convocation sending  
`i9amati-front-end/src/pages/Voting.jsx` — voting UI and quorum logic  
`i9amati-front-end/src/pages/AgentLiveVoting.jsx` — real-time vote tallying  
`i9amati-back-end/routes/voting.js` — full route logic (getEligibleVoters uses tantièmes)  
`i9amati-back-end/models/Meeting.js` — Mongoose schema for reference types

---

## 4. Union Members

**Tracker status**: ⬜ Not Started

### What already exists

#### Frontend
| File | State |
|------|-------|
| `apps/web/src/pages/syndic/UnionMembers.tsx` | ✅ Read-only table — name/avatar, role badge, building, phone, status, "Voir" button |
| `apps/web/src/data/mock/union.ts` | ✅ Mock data with `mockUnionMembers` |

The table is a **solid base** — do not rewrite it.

#### Backend — DB schema
| Table | Fields | State |
|-------|--------|-------|
| `groups` | `id, name, slug, residence_id, building_id, timestamps` | ✅ Exists — a "union council" is a Group |
| `_profile_groups` | `id, group_id, profile_id, role (USER/ADMIN/RIGHT_HAND)` | ✅ Exists — member role within the group |

#### Backend — API routes
| Route | State |
|-------|-------|
| Any `/api/union` or `/api/groups` routes | ❌ Do not exist in refactored API |

> The old backend had `i9amati-back-end/routes/unionAgent.js`. Reference only.

### What is missing

**Frontend** (build on top of existing `UnionMembers.tsx`):
- "Ajouter membre" button → modal form (select existing profile/owner, assign role: Président / Secrétaire / Trésorier / Membre)
- Edit role / remove member actions in each row
- Term start/end date fields (optional, nice-to-have)
- "Voir" row expansion → member detail panel (apartments owned, meetings attended)

**Backend** (new routes needed):
- `GET  /api/groups/:id/members` — list members of union council group
- `POST /api/groups/:id/members` — add a profile to the group with a role
- `PUT  /api/groups/:id/members/:profileId` — change role
- `DELETE /api/groups/:id/members/:profileId` — remove member

### Old logic to reference
`i9amati-front-end/src/pages/union-members.jsx` — full list + add member flow  
`i9amati-front-end/src/pages/union-newpage.jsx` — alternative layout  
`i9amati-back-end/routes/unionAgent.js` — old route logic

---

## 5. Meetings Analytics Dashboard

**Tracker status**: ⬜ Not Started (tracker) — but draft EXISTS

### What already exists

| File | State |
|------|-------|
| `apps/web/src/pages/syndic/dashboards/MeetingsDash.tsx` | ✅ Draft exists — KPI cards (total meetings, scheduled, active votes) + status PieChart + vote result breakdown cards |

The dashboard has a **solid draft**. It reads from `mockMeetings` and inline `mockVotes`. The route `/syndic/dash/meetings` is already wired in `App.tsx`.

### What is missing / needs polish

- Quorum rate by meeting (bar chart or list — currently missing)
- Average attendance % trend over time
- Inline `mockVotes` in `MeetingsDash.tsx` should move to `apps/web/src/data/mock/meetings.ts` to stay consistent
- Once the Meetings page is done and has richer mock data, pull from there instead of hardcoding

### Verdict
**Low effort** — mostly done. Polish the data coupling and add the quorum chart.

---

## 6. Union Analytics Dashboard

**Tracker status**: ⬜ Not Started (tracker) — but draft EXISTS

### What already exists

| File | State |
|------|-------|
| `apps/web/src/pages/syndic/dashboards/UnionDash.tsx` | ✅ Draft exists — KPI cards (total, active, pending) + role PieChart + members-per-building breakdown |

The dashboard reads from `mockUnionMembers`. Route `/syndic/dash/union` is wired in `App.tsx`.

### What is missing / needs polish

- Term expiry timeline (which members' mandates end soon) — currently no `term_end` in mock data
- Election history (which AG meeting elected each member)
- Both require `mockUnionMembers` to be extended with `termStart`, `termEnd`, `electedAtMeetingId` fields

### Verdict
**Low effort** — mostly done. Extend mock data, add 1–2 more chart panels.

---

## Ground Rules

| Rule | Detail |
|------|--------|
| **Mock data only** | All web data in `apps/web/src/data/mock/<module>.ts` until API routes exist |
| **Design system** | Strictly follow `DESIGN.md` — colors, spacing, card structure |
| **Reuse components** | `TopBar`, `Card`, `Badge`, `Button`, `Avatar`, `Progress` from `@/components/ui/` |
| **No Accounting** | Accounting belongs to Yahia (and partially shared). Don't touch `Accounting.tsx` or `AccountingDash.tsx` |
| **API stack** | Refactored API = **Kysely + PostgreSQL** (not Mongoose). Old backend routes = reference only |
| **Auth** | Use `authClient` from `@/lib/auth-client` — never re-implement session logic |
| **Shared types** | Types shared between web and API go in `packages/shared/src/` — import as `@i9amati/shared` |
