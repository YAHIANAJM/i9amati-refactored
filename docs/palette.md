# i9amati Platform Color Palette

## Core Colors

| Name           | Hex       | Role                                      |
|----------------|-----------|-------------------------------------------|
| Midnight Wine  | `#33091B` | Dark structural, danger, deep dark        |
| Mauve Rose     | `#8F5C64` | Owners, people sections, facilities       |
| Dusty Coral    | `#D97172` | Warnings, alerts, occupied states         |
| Warm Bronze    | `#C18D52` | **Primary accent** — borders, icons, UI   |
| Deep Forest    | `#203B37` | Buildings, structural, numeric counts     |
| Sage Green     | `#5A8F76` | Healthy / active states                   |
| Seafoam Mint   | `#9ABCAB` | Vacant, light positive                    |
| Pale Dogwood   | `#F9D3C0` | Softest neutral, input backgrounds        |
| Viridian       | `#548A82` | Mid-tone bridge                           |

## Reserved Brand Color

| Name        | Hex       | Use                                              |
|-------------|-----------|--------------------------------------------------|
| Brand Teal  | `#2B8C80` | **Primary action buttons ONLY** (Manage, Save, Login, Submit) |

Brand Teal is **not** used for decorative elements, status badges, icons, or data visualization. Everything decorative uses the 9-color palette above.

---

## Category → Color Mapping

These assignments are consistent across ALL filter chips, stat tiles, badges, and UI elements.

| Category           | Color          | Hex       |
|--------------------|----------------|-----------|
| Status             | Dusty Coral    | `#D97172` |
| Facilities         | Mauve Rose     | `#8F5C64` |
| Search / Text      | Midnight Wine  | `#33091B` |
| City / Location    | Warm Bronze    | `#C18D52` |
| Numeric / Floors   | Deep Forest    | `#203B37` |
| Active / Occupied  | Sage Green     | `#5A8F76` |
| Vacant             | Midnight Wine  | `#33091B` |
| Usage: Residential | Deep Forest    | `#203B37` |
| Usage: Commercial  | Dusty Coral    | `#D97172` |
| Usage: Mixed       | Warm Bronze    | `#C18D52` |
| Owners / People    | Mauve Rose     | `#8F5C64` |

---

## Background Opacity Rules

Tailwind JIT does **not** support the `/8` shorthand for arbitrary hex colors. Always use bracket notation:

```
bg-[#C18D52]/[0.12]   ✅
bg-[#C18D52]/8        ❌ (does not render)
```

Standard opacity levels:
- **0.06** — resting button/icon background
- **0.10–0.12** — chip / badge background
- **0.14** — hover state background
- **0.18–0.20** — input field background (e.g. Pale Dogwood)

---

## Stat Tile Pattern

Each colored tile box (e.g. Étages, Unités, Occupés in building cards):
- Number → full color (`text-[#C18D52]`)
- Label → same color at 70% opacity (`text-[#C18D52] opacity-70`)
- Background → same color at 10–12% (`bg-[#C18D52]/[0.12]`)

Never use `text-muted-foreground` inside a colored stat box.

---

## Status Badge Pattern

Badges use `<span>` (not the `<Badge>` component) with a pre-built `cls` string:

```ts
const STATUS_CLS = 'inline-flex items-center rounded-md px-2 py-0.5 font-semibold border text-[10px]'

const residenceStatus = {
  ACTIVE:      { label: 'Actif',   cls: `${STATUS_CLS} bg-[#5A8F76]/[0.12] text-[#5A8F76] border-[#5A8F76]/30` },
  MAINTENANCE: { label: 'Travaux', cls: `${STATUS_CLS} bg-amber-50 text-amber-600 border-amber-200` },
  INACTIVE:    { label: 'Inactif', cls: `${STATUS_CLS} bg-[#8F5C64]/[0.12] text-[#8F5C64] border-[#8F5C64]/30` },
}

const aptStatus = {
  OCCUPIED:    { label: 'Occupé',  cls: `${STATUS_CLS} bg-[#5A8F76]/[0.12] text-[#5A8F76] border-[#5A8F76]/30` },
  VACANT:      { label: 'Vacant',  cls: `${STATUS_CLS} bg-[#33091B]/[0.08] text-[#33091B] border-[#33091B]/20` },
  MAINTENANCE: { label: 'Travaux', cls: `${STATUS_CLS} bg-amber-50 text-amber-600 border-amber-200` },
}
```

---

## Icon & Interactive Element Rules

- Filter icon, Bell notification button: always show Bronze tint at rest
  - `border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52]`
  - Hover: `hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60`
- Unread notification dot: `bg-[#C18D52]`
- Alert/destructive notification badge: `bg-[#D97172]`
- `hover:text-primary` is replaced everywhere with `hover:text-[#C18D52]`
