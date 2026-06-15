# Design

## Theme

Light mode app shell on a grey canvas. White cards float on `#d8dce3` page background - the grey creates depth and separates regions without borders. Dark sidebar for strong visual anchor on the left.

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Primary | `hsl(221 83% 53%)` / `#3b82f6` | CTAs, active nav, links, chart primary |
| Background | `hsl(0 0% 100%)` | Cards, modals, TopBar |
| Page canvas | `#d8dce3` | Body background - the "table" cards sit on |
| Foreground | `hsl(222 47% 11%)` | Body text, headings |
| Muted | `hsl(210 40% 96%)` | Secondary backgrounds, input fills |
| Muted foreground | `hsl(215 16% 47%)` | Captions, labels, secondary text |
| Border | `hsl(214 32% 91%)` | Dividers, card borders |
| Destructive | `hsl(0 84% 60%)` | Errors, delete actions |
| Sidebar bg | `hsl(222 47% 11%)` | Left nav panel (dark navy) |
| Sidebar text | `hsl(210 40% 98%)` | Sidebar labels, icons |

### Semantic status colors (used consistently across all modules)
| Status | Background | Text |
|--------|------------|------|
| Success / Paid / Occupied | `bg-emerald-50` | `text-emerald-600` |
| Warning / Pending / Maintenance | `bg-amber-50` | `text-amber-600` |
| Danger / Overdue / Urgent | `bg-red-50` | `text-red-600` |
| Info / Neutral | `bg-blue-50` | `text-blue-600` |
| Inactive / Vacant | `bg-slate-100` | `text-slate-500` |

### Facility / tag pill colors (cycling)
`blue → violet → emerald → amber → pink → cyan` - light background + darker same-hue text.

## Typography

- **Font**: Inter (system-ui fallback) - loaded from system or CDN
- **Scale**:
  - Page title (TopBar h1): `text-base font-semibold`
  - Section headings (CardTitle): `text-sm font-semibold`
  - Body / table rows: `text-sm`
  - Labels / captions: `text-xs text-muted-foreground`
  - Micro labels (stats, time): `text-[11px]`
  - Section dividers in sidebar: `text-[11px] font-extrabold tracking-widest uppercase`

## Spacing & Layout

- **App shell**: Sidebar (fixed, 240px) + main area (flex-1, scrollable)
- **Page padding**: `p-6` on main content area
- **Card padding**: `p-5` standard, `px-5 py-4` for chart cards
- **Grid**: `grid-cols-2 lg:grid-cols-4` for KPI rows; `lg:grid-cols-3` for chart rows
- **Gap**: `gap-4` between cards, `gap-3` within card content, `gap-2` for tight rows
- **Border radius**: `0.5rem` base (--radius); buttons/inputs inherit; pills use `rounded-full`

## Components

### Card
White background, `border border-border`, `rounded-lg shadow-sm`. Cards are the primary content container. They sit on the grey page canvas.

### TopBar
Sticky top, `bg-background/95 backdrop-blur`, `border-b`. Contains: `h1` title + optional subtitle (accepts `React.ReactNode` - can be pill badges), search input, bell icon with red dot, settings icon, optional actions slot.

### Sidebar
Dark navy (`hsl(222 47% 11%)`). Collapsible accordion sections. DASHBOARDS section open by default; all others closed until the user navigates to their route (auto-open via `useLocation`). Section labels: `text-[11px] font-extrabold tracking-widest uppercase`. Active nav item: `bg-sidebar-accent`.

### KPI Card
Icon badge (colored `bg-*-50` rounded-lg) + large bold number + small label + optional progress bar + micro sub-text.

### Status Badge / Pill
`rounded-full px-2 py-0.5 text-xs font-medium`. Colors from semantic status table above.

### Data Table
`text-sm`, alternating row hover `hover:bg-muted/40`, sticky header. Inline expansion rows for drill-down (e.g. apartment → owner panel).

### Donut Chart
`innerRadius=45 outerRadius=65`, `paddingAngle=3`, `startAngle=90`. Legend as custom `LegendDot` rows below chart.

### Area / Bar Chart
`CartesianGrid` vertical=false, `stroke="#f1f5f9"`. No axis lines, no tick lines. Tooltip: `borderRadius: 8, border: 1px solid #e2e8f0`. Gradient fills for area charts.

## Motion

Framer Motion is installed. Use sparingly:
- Page enter: `animate-fade-in` (opacity 0→1, 200ms)
- Card hover: subtle `scale(1.01)` or shadow lift - not required on every card
- Drill-down transitions: slide-in from right when navigating deeper (residences → buildings → apartments)
- Always wrap with `prefers-reduced-motion` check or use `useReducedMotion()`

## Iconography

Lucide React throughout. Stroke icons only - no filled icons except for status indicators. Icon sizes: `16` default, `14` in compact rows, `18` in KPI card badges.

## Images

- Building/residence images: Unsplash URLs as default placeholders
- Owner avatars: DiceBear `avataaars` style - `https://api.dicebear.com/7.x/avataaars/svg?seed=male` / `seed=female` as gender-based fallback when no `profileImage` set
