-- ============================================================================
-- STEP 6 (CORRECTED) — PRIVATE NOTES ABOUT YOUR OWN THINGS SHOULD BE PRIVATE
--
-- ⚠️ THE FIRST VERSION OF THIS FILE DID NOTHING. That was my mistake, not a
-- mistake you made. It said:
--
--     REVOKE SELECT (personal_notes, …) ON public.inventory_items FROM anon;
--
-- In PostgreSQL a column-level REVOKE cannot subtract from a TABLE-level
-- grant, and `anon` holds table-wide SELECT here. So it ran, reported
-- success, and changed nothing — I confirmed from outside that all four
-- columns were still readable afterwards. The profiles file worked precisely
-- because it did the opposite: revoke the whole table, then grant the
-- allowed columns back. Same shape here now.
--
-- WHAT IS STILL WRONG, measured 30 Oct with the public key (counts only):
--     personal_notes    1 row     private notes about your own belongings
--     purchase_date     1 row
--     love_rating       3 rows
--     usage_frequency   2 rows
--
-- WHY THE GRANT LIST IS SAFE. It is every inventory_items column the BUILT
-- website bundle actually asks for, minus those four, plus a handful of
-- harmless delivery flags so a page that asks for one later does not break.
-- Nothing sensitive is in the list.
--
--   * The signed-in app and dashboard are the `authenticated` role and are
--     untouched — including the screens that legitimately read all four
--     (Insights, Declutter, CsvExport, ItemDetailSheet).
--   * The two public counters on /welcome used to ask for `*`, which a
--     column grant refuses outright. They count `id` now, and that is
--     already live.
--   * RLS policies are NOT subject to column grants, so the admin-hidden and
--     sharing_level rules keep working regardless.
-- ============================================================================

BEGIN;

REVOKE SELECT ON public.inventory_items FROM anon;

GRANT SELECT (
  id, user_id, name, brand, description, color, condition, size,
  category_id, tags, quantity, image_urls,
  sharing_level, is_available_for_sharing,
  is_for_borrow, is_for_sale, is_sold, is_donated, is_eliminated,
  rent_price, rent_window, sharing_price, sold_price, original_price,
  allow_offers, courier_available, handoff_available, shipping_available,
  admin_hidden,
  created_at, updated_at
) ON public.inventory_items TO anon;

COMMIT;

NOTIFY pgrst, 'reload schema';


-- ─── CHECKING IT ────────────────────────────────────────────────────────────
-- Not from the SQL editor — it connects as the service role and ignores all
-- of this. Tell me when it has run and I will re-measure from outside, as I
-- did to catch my own error above.
--
-- ─── IF THE SITE BREAKS, PUT IT BACK INSTANTLY ──────────────────────────────
-- GRANT SELECT ON public.inventory_items TO anon;
-- NOTIFY pgrst, 'reload schema';
