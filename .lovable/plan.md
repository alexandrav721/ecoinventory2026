## Goal

Replace the static motivational subtitle in the dashboard greeting card with a dynamic **Insight Unlocks** panel that gives users a tangible reason to keep adding items.

## Where it goes

`src/components/dashboard/WelcomeHeader.tsx` — directly under the "Hey {firstName}." headline, replacing the `motivationalMessage` paragraph. The "Add item" button stays in the header row. Works for both real users and demo mode (already gets `stats.totalItems`).

## New component

Create `src/components/dashboard/InsightUnlocksPanel.tsx`:

**Props:** `{ totalItems: number }`

**Structure:**

1. **Progress strip (top)** — soft blue→green gradient background (`from-primary/5 via-accent/5 to-emerald-50`), rounded-xl, hairline border.
   - Headline line: 
     - If below first threshold: `"You have {n} items — {needed} more to unlock your first insight"`
     - Between thresholds: `"{n} items logged — {needed} more until {next insight name}"`
     - All unlocked: `"All insights unlocked — keep building your inventory"`
   - Progress bar: green fill (`bg-emerald-500`) animating to `(totalItems / nextThreshold) * 100`. Uses existing `Progress` component with custom indicator color override, or a plain div bar for color control.

2. **Three teaser cards in a row** (`grid-cols-3`, gap-3):
   - `{ emoji: "💰", title: "Your resale value", threshold: 5 }`
   - `{ emoji: "🔄", title: "Duplicate finder", threshold: 10 }`
   - `{ emoji: "🤝", title: "Borrow from neighbors", threshold: 15 }`

   **Locked state:** muted card, `Lock` icon (lucide) top-right, grayscale emoji (CSS filter), title in muted-foreground, small chip "Unlock at {threshold} items".

   **Unlocked state:** full color, no padlock, subtle ring (`ring-1 ring-emerald-400/40`), small green check chip "Unlocked", `animate-scale-in` on the transition tick.

   On mobile (<640px) collapse to a horizontal scroll row or 1-col stack — pick `grid-cols-1 sm:grid-cols-3` for simplicity.

3. **Unlock animation:** track previously seen unlocks in `localStorage` (`loop-unlocks-seen`, JSON array of thresholds). When `totalItems` crosses a threshold not yet in the list, briefly add an `animate-scale-in` + ring-pulse class to that card and append the threshold to localStorage so it doesn't replay on refresh. No confetti here (already used in AddItemModal milestones).

## WelcomeHeader edits

- Remove `getMotivationalMessage`, `getNextMilestone`, `progressToMilestone` (now handled inside the new panel).
- Remove the `<p>{motivationalMessage}</p>` line.
- Render `<InsightUnlocksPanel totalItems={stats.totalItems} />` below the greeting card (or inside it, beneath the headline row — preferred so it visually belongs to the welcome block).

## Visual notes

- Soft gradient: `bg-gradient-to-br from-primary/5 via-accent/5 to-emerald-50/60` on the progress strip wrapper.
- Cards: `rounded-xl border p-3` with `bg-card` for unlocked, `bg-muted/30` for locked.
- Use lucide `Lock` and `Check` icons; keep emojis as text per spec (this is product UI, emojis allowed here).
- Progress bar height `h-2`, full width, with green fill.

## Edge cases

- `totalItems === 0`: progress shows 0%, message reads "Add your first item — 5 more to unlock your first insight".
- `totalItems >= 15`: all three cards unlocked, progress bar at 100% green, message "All insights unlocked".
- Demo mode: `stats.totalItems = 42` already — all unlocked, all cards show in unlocked state immediately (no animation since localStorage prevents replay after first view).

## Out of scope

- Wiring the unlocked cards to actual insight pages (they remain visual teasers for now — clicking does nothing or shows a tooltip "Coming soon"). Confirm if you want them clickable.
- Changing the milestone toasts in `AddItemModal` (those stay at 1/5/10).
