# Payments Section — Vision & Logic
**i9amati Syndic Platform**
Last updated: June 2026

---

## What this section IS and is NOT

**IS:** A functional management tool — record payments, track who paid, add expenses, manage project funds, mark things as paid/overdue. The syndic operates from here daily.

**IS NOT:** An analytics dashboard. Charts, graphs, KPI trends → those go in the standalone Payments Analytics page (built later, once real data exists).

The reference image (Fincan.io) was used only for layout inspiration. We take the **structure** (hero card, list of saving-plan cards, transactions table) but fill it with **operational controls**, not visualizations.

---

## What a Syndic Does in Payments (3 Jobs)

### Job 1 — Collect owner fees
Every apartment has a monthly syndic fee. The syndic records when each owner pays. Sees who is pending, who is late, who is overdue. Can mark payment as received (cash, transfer, check). Can send a reminder.

### Job 2 — Record expenses
The syndic pays for things: cleaning crew, elevator repair, security guard, admin costs. Every expense is logged with category, amount, who was paid, and optional receipt.

### Job 3 — Manage project funds
When a meeting vote passes on a building project (elevator fix, roof repair), a fund is created. Each owner owes a share. The syndic tracks collection: who paid their project contribution, who hasn't. When fully funded, the money is released for the project.

---

## Tab Structure

```
Fees  |  Expenses  |  Projects
```

No "Overview" tab with analytics. Each tab is a working management screen.

A small **summary bar** (not a dashboard) sits at the top of the page showing 3 live numbers:
- Syndic balance (total collected − total spent)
- Outstanding fees (unpaid owners this period)
- Active projects (number of ongoing project funds)

These are quick-read status numbers, not charts.

---

## Tab 1 — Fees

**Purpose:** See and manage owner fee collection for the current period.

### Top controls
- Period selector (Month / Quarter / Year) — default: current month
- Filter by: Residence · Building · Status (All / Paid / Pending / Overdue)
- Search by owner name or unit
- "Add Fee Payment" button (for manual cash payments)

### Owner Fee Table
Each row = one apartment/unit for the selected period.

| Owner | Unit | Building | Fee Amount | Due Date | Paid Date | Status | Actions |
|-------|------|----------|------------|----------|-----------|--------|---------|
| Mohamed Fassi | A-101 | Bât A | 500 MAD | 01/06 | 03/06 | ✅ Paid | View |
| Fatima Benchou | A-102 | Bât A | 500 MAD | 01/06 | — | ⚠️ Pending | Mark Paid · Remind |
| Youssef Alami | A-103 | Bât A | 500 MAD | 01/06 | — | 🔴 Overdue | Mark Paid · Remind |

**Status logic:**
- Paid → payment recorded for this period
- Pending → period is current, due date not yet passed
- Overdue → due date passed, no payment

**"Mark Paid" action** opens a small inline form:
- Amount (pre-filled, editable)
- Payment method: Cash · Bank transfer · Check
- Date received
- Optional note
- Confirm → row flips to Paid, receipt auto-generated

**"Remind" action** → (placeholder for now, will wire to Alerts section)

### Fee History (per owner)
Clicking an owner opens a side panel:
- Full payment history across all periods
- Total paid this year
- Months overdue (if any)
- Quick "Add payment" from the panel

---

## Tab 2 — Expenses

**Purpose:** Record and browse every expense the syndic has made.

### Top controls
- Period filter (Month / Quarter / Year / Custom range)
- Filter by category
- "Add Expense" button

### Add Expense Form (modal or inline)
- Description (text)
- Category: Maintenance · Cleaning · Security · Admin · Utilities · Repairs · Other
- Amount (MAD)
- Date
- Paid to (vendor / person name)
- Receipt upload (optional — just a file, no processing yet)
- Linked to: Residence · Building · Project (optional, for context)

### Expenses Table
| Description | Category | Date | Amount | Paid To | Linked To | Receipt | Added By |
|-------------|----------|------|--------|---------|-----------|---------|----------|
| Elevator maintenance | Maintenance | 10/06 | 2,000 MAD | Otis Morocco | Bât A | 📎 | Yahia |
| Cleaning service | Cleaning | 01/06 | 800 MAD | Société Propre | Résidence Nour | — | Yahia |

- Each row has: Edit · Delete (with confirmation)
- Receipt column: shows paperclip icon if file attached, click to preview

### Running Total
Below the table, a simple text line:
`Total spent this period: 14,500 MAD`
No charts. Just the number.

---

## Tab 3 — Projects

**Purpose:** Manage voted project funds and track per-owner contribution collection.

### Project Fund Card
Each approved meeting vote that requires owner contributions becomes a Project Fund card.

```
┌─────────────────────────────────────────────────────────┐
│  Elevator Repair — Bâtiment A                           │
│  Voted in: Meeting 14 May 2024                          │
│  Target: 80,000 MAD   |   Collected: 52,000 MAD         │
│  ████████████████░░░░░░░  65%                           │
│                                                         │
│  Per-owner share: 2,500 MAD (equal split, 32 units)     │
│  Status: 🟡 Collecting                                  │
│                                                         │
│  [  Add Payment  ]  [  Remind All Pending  ]  [ ··· ]  │
└─────────────────────────────────────────────────────────┘
```

Below each card: the **Owner Participation Box** (collapsible, open by default)

### Owner Participation Box
This is the key UI element the syndic needs most.

```
Owner Contributions — Elevator Repair
21 paid · 11 pending

┌──────────────┬──────────┬──────────┬────────────────────┐
│ Owner        │ Unit     │ Share    │ Status             │
├──────────────┼──────────┼──────────┼────────────────────┤
│ M. Fassi     │ A-101    │ 2,500 MAD│ ✅ Paid  03/06     │
│ F. Benchou   │ A-102    │ 2,500 MAD│ ⏳ Pending          │  [Mark Paid]
│ Y. Alami     │ A-103    │ 2,500 MAD│ 🔴 Overdue          │  [Mark Paid] [Remind]
│ K. Benali    │ A-201    │ 2,500 MAD│ ✅ Paid  01/06     │
│ ...          │          │          │                    │
└──────────────┴──────────┴──────────┴────────────────────┘
```

- Filter rows: All · Paid · Pending · Overdue
- "Mark Paid" → same inline form as Fees tab (amount, method, date, note)
- "Remind All Pending" → placeholder, wires to Alerts later
- When 100% collected → card status changes to ✅ Fully Funded, progress bar goes green

### Project Lifecycle States
```
Vote Passed → Collecting → Fully Funded → In Progress → Done
```
Syndic manually moves between states (except Vote Passed → Collecting which is auto on fund creation).

### Creating a Project Fund
"Create Project Fund" button opens a form:
- Project name + description
- Linked meeting/vote (optional dropdown)
- Target budget (MAD)
- Split method: Equal per unit · Proportional by m²
- Select which units are included (default: all in the building/residence)
- Due date for contributions (optional)

---

## Summary Bar (top of page, not a tab)

Three read-only chips always visible at the top:

```
💰 Syndic Balance: 38,200 MAD   |   ⚠️ 7 owners overdue   |   🔧 3 active projects
```

These update live as the syndic records payments and expenses.
Not expandable, not a dashboard — just a quick status read before the syndic opens a tab.

---

## The Voting → Payment Connection

The Meetings section (built later) will have votes. When a vote passes on a project:
- A "Create Project Fund" prompt appears in Payments
- The syndic confirms the amount and split method
- The Owner Participation Box populates automatically from the building's owner list

For now (before Meetings is built): the syndic manually creates project funds via the form.

---

## Data that comes out of this section

Once Payments is working, the following data exists and can feed:
- **Payments Analytics dashboard** — trends, collection rates, expense breakdown by category, month-over-month
- **Accounting section** — full ledger (income vs expenses, fund history)
- **Owner profile** — payment history for each owner
- **Alerts section** — trigger reminders for overdue owners automatically

---

## What we are NOT building in this section

- Charts, graphs, donut charts, bar charts → Payments Analytics page (later)
- Online payment gateway → future feature
- Automatic late fees → future feature
- Bank reconciliation → Accounting section
- Email/SMS sending → Alerts section
- PDF invoice design → basic receipt generation is enough for now
