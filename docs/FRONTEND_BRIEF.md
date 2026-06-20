# Frontend Task Brief

> **For every task in this file:**
> 1. Read [`docs/IQAMATI_Story.md`](./IQAMATI_Story.md) first — understand who the user is and why this platform exists before writing a single component.
> 2. Use the **Claude design tool (DesignSync)** to produce and iterate on the UI before coding — don't build blind.
> 3. Read [`DESIGN.md`](../DESIGN.md) for the exact colors, spacing, component specs.
> 4. Read [`AYMAN_SCHEMA.md`](./AYMAN_SCHEMA.md) to know what already exists — do not duplicate.

---

## Why the story matters

i9amati is not a generic SaaS dashboard. It serves a **Moroccan syndic** who has been running a building on WhatsApp and paper receipts. Every screen you build is replacing something that was previously done by hand, in French or Arabic, often on a phone. If a screen feels like a generic Tailwind admin template, it is wrong.

Before building any page, ask: *"Would the syndic of Résidence Al Nour in Casablanca understand this in under 5 seconds?"*

---

## Task 1 — Login Page (polish) ✅ Done

**File**: `apps/web/src/pages/auth/Login.tsx`
**What exists**: functional form, Better Auth wired, redirects to `/syndic`

### Design brief for DesignSync

Design a login screen for a Moroccan property management app. The primary user is a syndic (property manager), 35–55 years old, moderately tech-savvy. The screen should feel professional and trustworthy — not intimidating. Key elements:

- Top: i9amati logo + tagline in Arabic **"إقامتي — نظام إدارة العمارات"** and French sub-label
- Card on a `#d8dce3` grey page background (same as the app shell)
- Email + password fields using the existing input style
- Primary blue CTA button (`hsl(221 83% 53%)`) — label: **"تسجيل الدخول / Se connecter"**
- Link below: "Première connexion ? Créer un compte"
- Link: "Mot de passe oublié ?"
- Small footer: "Powered by GSDF CLAIR"
- No illustrations, no stock photos — clean, text-forward

### What to add to the code
- Branding header (logo + Arabic/French tagline)
- Bilingual button and field labels
- "Créer un compte" link → `/auth/register`
- "Mot de passe oublié ?" link → `/auth/forgot` (can be placeholder for now)
- Apply `bg-[#d8dce3]` as page background to match app shell

---

## Task 2 — Registration / Onboarding ✅ Done

**File**: `apps/web/src/pages/auth/Register.tsx` ← needs to be created
**Route**: `/auth/register` ← needs to be added to `App.tsx`

### Design brief for DesignSync

Design a 3-step onboarding wizard for a new syndic registering on i9amati. Steps:

**Step 1 — Account**
- First name, last name, email, phone (Moroccan format +212), password, confirm password
- Progress bar at top: Step 1 of 3

**Step 2 — Your Syndicate**
- Syndicate/company name, city (dropdown of Moroccan cities), address
- Optional: upload logo
- Progress bar: Step 2 of 3

**Step 3 — First Residence**
- Residence name (e.g. "Résidence Al Nour"), number of buildings, number of apartments (approximate)
- This seeds their first residence on signup
- Progress bar: Step 3 of 3 + "Commencer →" final CTA

Each step: white card on grey background, back/next buttons, form validation inline.

### What to build
- Multi-step form state with `useState` (no external lib needed)
- Step 1: `authClient.signUp.email({ email, password, name, firstName, lastName, phone })`
- Steps 2–3: POST to `/api/residences` after auth (use org onboarding flow)
- On completion → redirect to `/syndic`

---

## Task 3 — Home Page (public landing)

**File**: `apps/web/src/pages/Home.tsx` ← needs to be created
**Route**: `/` ← replace current `<Navigate to="/syndic" />` in `App.tsx`

### Design brief for DesignSync

Design a clean public landing page for i9amati. Target: a syndic who heard about the platform and is visiting for the first time. The page should be **one scroll** — not a multi-section marketing site.

**Structure (top to bottom):**

1. **NavBar** — logo left, "Se connecter" ghost button + "Commencer gratuitement" filled button right
2. **Hero** — Large Arabic headline: **"أدِر إقامتك بذكاء"** ("Manage your residence intelligently"), French sub-headline: *"La plateforme de gestion de copropriété conçue pour le Maroc."*, single CTA button: "Commencer gratuitement →"
3. **3-column feature strip** — icon + title + one-line description for:
   - Collecte des charges (💳) — "Suivez chaque paiement, relancez automatiquement"
   - Réunions légales (🗓️) — "Organisez vos AG en conformité avec la loi 18-00"
   - Documents & PV (📄) — "Archivez, signez, et retrouvez tout en un clic"
4. **Social proof** — "Déjà utilisé par X syndics au Maroc" + 3 city names (Casablanca, Rabat, Marrakech)
5. **Footer** — Copyright GSDF CLAIR + link to login

**Tone**: Arabic headline, French body. No English on the landing page. Colors: white page, primary blue CTAs, dark navy footer. No photos.

### What to build
- Purely static React component, no data fetching
- Replace `<Navigate to="/syndic" />` with `<Home />`
- Keep it outside `<SyndicLayout>` — no sidebar, no TopBar

---

## Task 4 — Meetings & Voting (major)

**File**: `apps/web/src/pages/syndic/Meetings.tsx` (extend, do not rewrite)
**What exists**: read-only card list — solid base

### Design brief for DesignSync

Design the additions to the Meetings page. The existing list stays. Add:

**A — "Planifier une réunion" modal**
- Right-side drawer (not a centered modal — more space for the agenda list)
- Fields: Title, Type (AG Ordinaire / AG Extraordinaire / Réunion Normale), Date & Time picker, Location (text), Agenda items (dynamic list: + Add item button, each item has a title field + optional description)
- Footer: Cancel + "Planifier" CTA

**B — Meeting detail expanded view**
- Click "Détails" on any card → expands inline below the card (accordion pattern, not navigation)
- Shows: full agenda list, attendee list with quorum indicator (e.g. "14 / 19 présents — Quorum atteint ✓"), status timeline
- Each agenda item has a "Ouvrir le vote" button if meeting is IN_PROGRESS

**C — Voting panel**
- Opens inline under the agenda item
- Shows current tally: Pour X votes / Contre Y votes / Abstention Z votes — live updating bar
- Syndic can cast vote for each attendee (proxy voting) OR attendees vote themselves (owner view)
- "Clôturer le vote" button → locks results, marks item as voted
- After all items voted → "Générer le PV" button appears

**D — PV (Procès-Verbal) view**
- Modal or new page showing a printable summary: meeting title, date, location, attendees list, quorum, each resolution with result (Adopté / Rejeté), signatures section

### What to build (in order)
1. `CreateMeetingDrawer` component (controlled by `useState` in `Meetings.tsx`)
2. Expand `mockMeetings` data in `data/mock/meetings.ts` with `agenda[]`, `attendees[]`, `quorumReached`
3. Accordion detail panel per meeting card
4. `VotingPanel` sub-component per agenda item
5. PV summary modal
6. API integration last (once routes exist in `apps/api/src/routes/`)

---

## Task 5 — Union Members (medium)

**File**: `apps/web/src/pages/syndic/UnionMembers.tsx` (extend, do not rewrite)
**What exists**: read-only table — solid base

### Design brief for DesignSync

Design the additions to the Union Members page:

**A — "Ajouter membre" modal**
- Search/select from existing owners (autocomplete from apartments data)
- Role selector: Président du Conseil / Secrétaire / Trésorier / Membre
- Term start date + optional term end date
- Note: members are co-owners elected at an AG meeting — add a "Élu lors de:" field linking to a meeting

**B — Row actions**
- Edit role button → inline role dropdown
- Remove button → confirmation popover ("Retirer ce membre du conseil ?")
- Voir button → side panel with member's apartments, payments history, meeting attendance

**C — Status indicators**
- Term expiry warning badge: if `termEnd` < 90 days → amber "Mandat expire bientôt"
- Vacant role warning at top of page if council has no Président or Trésorier

### What to build (in order)
1. Extend `mockUnionMembers` in `data/mock/union.ts` with `termStart`, `termEnd`, `electedAtMeetingId`
2. `AddMemberModal` component
3. Edit role inline dropdown
4. Remove confirmation popover (use `@radix-ui/react-popover` — already in `components/ui/`)
5. API integration last

---

## Task 6 — Meetings Analytics Dashboard (polish)

**File**: `apps/web/src/pages/syndic/dashboards/MeetingsDash.tsx`
**What exists**: KPI cards + status pie + vote cards — drafted, mostly done

### Design brief for DesignSync

Add two panels to the existing dashboard:

**Quorum rate list** — for each completed meeting: meeting title, date, quorum % achieved (e.g. 74%), "Atteint / Non atteint" badge. Sorted newest first.

**Resolutions timeline** — vertical list of all voted resolutions with result badge (Adopté ✓ / Rejeté ✗) and the % split. Shows the history of decisions the building has made.

### What to build
- Move inline `mockVotes` to `data/mock/meetings.ts`
- Add `quorumRate`, `attendanceCount`, `totalEligible` to mock meeting data
- Add quorum list panel and resolutions timeline panel to `MeetingsDash.tsx`

---

## Task 7 — Union Analytics Dashboard (polish)

**File**: `apps/web/src/pages/syndic/dashboards/UnionDash.tsx`
**What exists**: KPI cards + role pie + building breakdown — drafted, mostly done

### Design brief for DesignSync

Add one panel:

**Term expiry timeline** — list of members with their mandate end dates, sorted by soonest expiry. Each row: member name, role, days remaining, amber/red badge if < 90 or < 30 days. Lets the syndic plan the next election in advance.

### What to build
- Add `termStart`, `termEnd` to `mockUnionMembers` in `data/mock/union.ts`
- Add term expiry list panel to `UnionDash.tsx`

---

## Component Reuse Checklist

Before building any new UI element, check if it already exists:

| Need | Use |
|------|-----|
| Modal / Dialog | `components/ui/dialog.tsx` (Radix Dialog) |
| Drawer / Side panel | `components/ui/sheet.tsx` (Radix Sheet) |
| Confirmation popup | `components/ui/popover.tsx` (Radix Popover) |
| Status pill | `components/ui/badge.tsx` with `variant` prop |
| Form input | native `<input>` with design-system classes (see Login.tsx for example) |
| Select dropdown | `components/ui/select.tsx` (Radix Select) |
| Progress bar | `components/ui/progress.tsx` |
| Avatar | `components/ui/avatar.tsx` |
| Table | native `<table>` following the pattern in `Payments.tsx` or `UnionMembers.tsx` |
| Charts | `recharts` — follow patterns in `MeetingsDash.tsx` / `UnionDash.tsx` |
| Page header | `components/layout/TopBar.tsx` — always the first element in a page |
| Icons | `lucide-react` — stroke only, 16px default |
