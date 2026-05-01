## Goal

When a user successfully adds an item, replace the plain `toast.success("Item added successfully!")` with a celebratory **Add Success Modal** featuring confetti, the item name + estimated value, one personalized hook tied to their inventory progress, and two CTAs.

## New component

Create `src/components/dashboard/AddSuccessModal.tsx`:

**Props:**
```ts
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  estimatedValue?: number | null;
  totalItemsAfter: number;   // user's total count AFTER this insert
}
```

**Layout** (uses shadcn `Dialog`):
- Compact, centered modal (~`max-w-md`).
- **Confetti layer**: pure CSS — ~30 absolutely-positioned `<span>` confetti pieces in a relative container at the top of the dialog, each with random `left`, `animationDelay`, and one of 4 brand colors (primary, accent, emerald, amber). Animation falls + spins for ~2.5s. Define `@keyframes loop-confetti-fall` in the component via a `<style>` tag (scoped) or inline keyframes — simplest is a small CSS block at the bottom of `index.css`. **Decision**: add keyframes to `src/index.css` (`@keyframes loop-confetti-fall { ... }`) and use Tailwind arbitrary values for animation. Keep it lightweight, no library — `canvas-confetti` is already a dep but spec asks for "simple CSS".
- **Headline**: `🎉 {itemName} added!` (h2, font-display).
- **Sub-line** (only if `estimatedValue` present): `Estimated worth: ${value}` in muted text with TrendingUp icon.
- **Personalized hook card**: amber/soft tinted box with a Lightbulb icon. Hook text generated from `totalItemsAfter`:
  - `1`: "Your first item! Add 4 more to unlock your resale value insights."
  - `2-4`: "You're now {5 - n} items away from seeing your resale insights."
  - `5-9`: "{10 - n} more and Loop will start spotting duplicates for you."
  - `10-14`: "{15 - n} more items and you'll unlock borrow-from-neighbor matches."
  - `15+`: Pick from a small rotating set, e.g., "12 neighbors near you have items like this — check the Borrow tab."
- **CTAs** (footer):
  - Primary: `Keep adding →` — closes modal, stays on AddItem page (resets form to blank for "select" mode).
  - Secondary (link/ghost): `View my inventory` — navigates to `/dashboard?tab=inventory`.
- **Auto-dismiss**: do NOT auto-close. User must click. Confetti animation runs once on open.

## Wire-up in `src/pages/AddItem.tsx`

Currently three save paths fire `toast.success` then `navigate("/dashboard")`:
1. **Single manual save** (line ~212): replace `toast.success("Item added successfully!"); navigate("/dashboard");` with: open modal with `itemName=formData.name`, `estimatedValue=parseFloat(formData.original_price) || null`, and the freshly-fetched `totalItemsAfter` count.
2. **Smart-AI multi-item insert** (line ~334): keep aggregate toast `"✨ Added {n} items!"` AND open the modal once with `itemName="{n} items"` (or use the first item's name + "and {n-1} more"), summed estimatedValue.
3. **Bulk image save** (line ~500+): same pattern as #2.

To get `totalItemsAfter` cheaply: after insert, run a `supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_sold", false).eq("is_donated", false).eq("is_eliminated", false)` and use the returned `count`.

State additions in `AddItem.tsx`:
```ts
const [successModal, setSuccessModal] = useState<{
  open: boolean;
  itemName: string;
  estimatedValue: number | null;
  totalItemsAfter: number;
} | null>(null);
```

Render `<AddSuccessModal ... />` at the bottom of the page.

The modal's "Keep adding" handler resets `formData` to the initial blank state and sets `mode` back to `"select"`. "View my inventory" calls `navigate("/dashboard?tab=inventory")`.

## CSS additions in `src/index.css`

Append:
```css
@keyframes loop-confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
}
.loop-confetti-piece {
  position: absolute;
  top: 0;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  animation: loop-confetti-fall 2.4s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
}
```

## Out of scope

- The `AddItemModal` (email-scan / photo / "just tell me" flow) on the dashboard — that already has its own per-item milestone confetti via `canvas-confetti`. Leave it alone unless you also want the success modal there. **Confirm**: the user spec says "when item save is confirmed", which most cleanly maps to the real save in `AddItem.tsx`. Will only wire that page.
- Real "friends nearby with this item" lookup — the personalized hook stays as static copy keyed off item count.
