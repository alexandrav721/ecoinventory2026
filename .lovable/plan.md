## Goal

When the user's My Assets gallery has **fewer than 5 items**, show a motivating full-width preview banner above the grid (instead of a sparse, discouraging layout). The grid still renders below with whatever items exist; the banner shows what insights they'll unlock.

## New component

Create `src/components/dashboard/LowInventoryPreviewBanner.tsx`:

**Props:** `{ itemCount: number; onAddItem: () => void }`

**Layout:**
- Full-width rounded card, soft gradient background (`from-primary/5 via-accent/5 to-emerald-50/60`), matching the InsightUnlocksPanel aesthetic.
- Header row: 
  - Left: `✨ Your inventory is just getting started` (h3) + subtitle: `"Here's what Loop will show you when you add {5 - itemCount} more items:"` (or "a few more items" if count >= 5).
  - Right: prominent **"Add item"** button (primary, with `Plus` icon) — wired to `onAddItem`.
- Three preview cards (`grid-cols-1 md:grid-cols-3 gap-3`), each grayed/blurred with a `Lock` icon and "Coming soon for you" pill:
  1. **Resale value tracker** — sample: "$1,240 in resellable items" / detail: "MacBook Pro · ~$680 · prices steady"
  2. **Duplicate finder** — "3 cameras across your home" / "Could free up ~$420 by selling 2"
  3. **Borrow from neighbors** — "8 items available within 0.5 mi" / "Drill, ladder, projector & more"
- Each preview card uses muted text colors (`text-foreground/60`, `text-muted-foreground`), grayscale icon tile, and a subtle backdrop-blur veil to signal "preview / locked".

## Integration in `InventoryPickleView.tsx`

- Import the new component.
- Render it conditionally **above the grid** (after the `DuplicateAlertBanner`, before `<div id="my-assets-grid">`) when `items.length < 5` AND `items.length > 0` (the existing `EmptyState` still handles the 0-item case — confirm with user, but keeping that empty state intact since it has its own primary CTA).
  - Actually, simpler: render when `items.length < 5` regardless — but the empty state currently early-returns. Keep the early return for 0 items (existing UX) and show banner for 1–4 items.
- `onAddItem` navigates to `/dashboard/add-item` (matches existing patterns in this file).

## Visual notes

- Uses existing semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border`).
- Lucide icons: `Plus`, `TrendingUp`, `Repeat`, `Users`, `Lock`.
- Mock data is hard-coded inside the component — no API calls.
- Works in both demo mode and real user mode (just keys off `items.length`).

## Out of scope

- Replacing the 0-item `EmptyState` (still shows when truly empty).
- Making preview cards clickable / wiring them to real insight pages.
