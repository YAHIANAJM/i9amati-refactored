# i9amati — In-Container Filter System

This document defines the filter UI pattern for the search + filter panel **inside page containers** (e.g. Owners' Association, Payments, Documents). This is not the global top Header search — it belongs to the content area of each page.

---

## Concept

Each page container has its own self-contained filter system with:
1. A **search input** — searches the specific data of that page
2. A **filter button** — opens a filter panel for that page's categories
3. **Filter chips** — appear above the list when filters are active
4. A **filter panel** — toggle groups organized by category

The visual language is identical across all pages. What changes per page is:
- The **categories** (each page defines its own)
- The **color assigned** to each category (follows the palette category map)
- The **filter options** (data-specific values)

---

## Search Input

```tsx
<div className="relative flex items-center">
  <Search size={14} className="absolute left-3 text-[#C18D52]/50 pointer-events-none" />
  <input
    placeholder="Rechercher..."
    className="h-8 w-72 rounded-md border border-[#C18D52]/30 bg-[#F9D3C0]/[0.18] pl-8 pr-3 text-sm
               placeholder:text-[#C18D52]/60
               focus:outline-none focus:ring-2 focus:ring-[#C18D52]/40 focus:border-[#C18D52]/60"
  />
</div>
```

Rules:
- Border: Bronze at 30% (`border-[#C18D52]/30`)
- Background: Pale Dogwood at 18% (`bg-[#F9D3C0]/[0.18]`) — warm, not teal
- Search icon: Bronze at 50%
- Placeholder: Bronze at 60%
- Focus ring: Bronze at 40%
- No `⌘K` shortcut badge
- No `bg-secondary` or `bg-muted` (those can be teal-tinted by the theme)

---

## Filter Button (Toggle)

```tsx
<button className="border border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52]
                   hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60 transition-all
                   flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium">
  <SlidersHorizontal size={14} />
  Filtres
  {activeCount > 0 && (
    <span className="ml-1 bg-[#C18D52] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
      {activeCount}
    </span>
  )}
</button>
```

Always shows Bronze tint at rest — never plain ghost/muted.

---

## Filter Chips

Each active filter renders as a chip. The chip color depends on the category it belongs to:

```ts
const CHIP_CLASSES: Record<string, string> = {
  '#33091B': 'bg-[#33091B]/[0.12] text-[#33091B] border-[#33091B]/30',
  '#D97172': 'bg-[#D97172]/[0.12] text-[#D97172] border-[#D97172]/30',
  '#8F5C64': 'bg-[#8F5C64]/[0.12] text-[#8F5C64] border-[#8F5C64]/30',
  '#C18D52': 'bg-[#C18D52]/[0.12] text-[#C18D52] border-[#C18D52]/30',
  '#203B37': 'bg-[#203B37]/[0.12] text-[#203B37] border-[#203B37]/30',
}
```

Chip render:
```tsx
<span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium', CHIP_CLASSES[chip.color])}>
  {chip.label}
  <button onClick={chip.remove}><X size={10} /></button>
</span>
```

Rules:
- All chips in the same category = same color
- Chips from different categories = different colors
- Never all the same color regardless of category

---

## Filter Panel

The panel slides open below the filter button. Each section is a category with toggle buttons.

### Category header
```tsx
<p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: categoryColor }}>
  {categoryLabel}
</p>
```

### Toggle button — unselected
```tsx
<button className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
  style={{
    borderColor: `${color}4D`,   // 30% opacity
    color:       color,
    background:  'transparent',
  }}>
  {option}
</button>
```

### Toggle button — selected
```tsx
<button className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
  style={{
    borderColor: color,
    color:       '#fff',
    background:  color,
  }}>
  {option}
</button>
```

Rule: Before selection, show the category color as border + text. After selection, fill with that same color.

---

## Category → Color Assignment (Standard)

| Category type     | Color          | Hex       |
|-------------------|----------------|-----------|
| Status            | Dusty Coral    | `#D97172` |
| Facilities / Tags | Mauve Rose     | `#8F5C64` |
| Search text       | Midnight Wine  | `#33091B` |
| City / Location   | Warm Bronze    | `#C18D52` |
| Numeric / Floors  | Deep Forest    | `#203B37` |

Each page defines its own categories but must pick a color from this table to stay visually consistent across the app.

---

## Notification Icon (In-Container)

The bell icon inside a page container (e.g. beside the filter button in Owners' Association):
- Shows notifications **specific to that page/module only**
- Uses same Bronze styling as the filter button
- Does **not** show global platform notifications

```tsx
<button className="relative flex items-center justify-center h-8 w-8 rounded-lg
                   border border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52]
                   hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60 transition-all">
  <Bell size={16} />
  {unreadCount > 0 && <span className="absolute top-1 right-1 ... bg-[#D97172]">{unreadCount}</span>}
</button>
```

Contrast with the **global Header bell** — that one shows notifications from all sidebar sections grouped by section label.

---

## Implementation Checklist for a New Page

- [ ] Search input: Bronze border + Pale Dogwood bg + Bronze placeholder
- [ ] Filter button: Bronze tint at rest (not ghost)
- [ ] Define categories + assign palette colors
- [ ] Build `CHIP_CLASSES` lookup or inline with category color
- [ ] Filter panel toggles: category color on border/text → filled on select
- [ ] Chips: show category color, same category = same color
- [ ] No `text-muted-foreground` inside colored stat boxes
- [ ] Status badges: use `<span>` with `cls` strings, not `<Badge>` component variants
