# Product

## Register

product

## Users

Multi-role platform — every actor in a Moroccan residential building ecosystem:
- **Syndic** (property manager): the primary operator. Day-to-day work is collecting fees, resolving complaints, organizing meetings, managing documents, and overseeing service contracts.
- **Property owners (co-owners)**: track their payment history, vote in meetings, submit requests, view building announcements.
- **Delegates / union members**: intermediate role between syndic and owners — building representatives who assist in management.
- More roles are planned (tenants, building staff, accountants).

All roles share one app; each sees a scoped view of the same data.

## Product Purpose

i9amati is a property syndic management platform built for the Moroccan residential market. It digitizes the full lifecycle of a Moroccan إقامة (residence complex) or عمارة (standalone building): from registering apartments and owners, through monthly fee collection and accounting, to complaints, community feed, legal meetings, and service contracts.

Success looks like: a syndic who previously ran everything on WhatsApp and paper now has one place where everything is tracked, every owner can see their status, and nothing falls through the cracks.

## Brand Personality

Professional, trustworthy, and approachable. Like a tool that takes your work seriously but doesn't intimidate you.
Three words: **Reliable. Clear. Human.**

The design should feel like it was made specifically for this context — not a generic SaaS template, not a government portal. It should inspire confidence in the syndic and feel respectful to the owner.

## Anti-references

- Legacy government / e-government portals (grey, form-heavy, intimidating)
- Generic off-the-shelf Tailwind/Bootstrap admin templates (cookie-cutter table layouts, copy-paste sidebar patterns)
- Anything that feels overly corporate or foreign — the product serves a local Moroccan audience

The current design direction (white cards on `#d8dce3` grey background, blue primary, clean sidebar) is intentional and good. Improvements should build on it, not replace it.

## Design Principles

1. **Clarity over cleverness** — every screen answers one question. Don't make the syndic hunt for what they need.
2. **Local first** — respect the bilingual Arabic/French reality of the audience. Design for RTL readiness even if currently English-only.
3. **Data earns its space** — show numbers only when they help a decision. Empty KPI cards are noise.
4. **Trust through detail** — small things (consistent spacing, correct icons, real data formats) signal that the software takes the user's work seriously.
5. **Progressive complexity** — simple entry point (dashboard), depth on demand (drill-down to apartments → owners). Never overwhelm on first load.

## Accessibility & Inclusion

- WCAG AA minimum contrast for all text
- Arabic RTL support planned (current UI is English-only during build phase)
- Touch-friendly targets for tablet use (syndics often work on iPad)
- Reduced motion: respect `prefers-reduced-motion` for all Framer Motion animations
