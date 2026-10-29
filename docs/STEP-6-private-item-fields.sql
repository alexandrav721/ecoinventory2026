-- ============================================================================
-- STEP 6 — PRIVATE NOTES ABOUT YOUR OWN THINGS SHOULD BE PRIVATE
--
-- Run after step 4. Safe to run twice. Rollback at the bottom.
--
-- WHAT IS WRONG. `inventory_items` hands every column to signed-out callers,
-- the same shape as the profiles problem. Measured 28 Oct with the public key
-- (counts only, no values read):
--
--     personal_notes    1 row    private notes people write about their things
--     purchase_date     1 row    when they bought it
--     love_rating       3 rows   how much they like it
--     usage_frequency   2 rows   how often they use it
--
-- None of these belong to a stranger browsing the marketplace. personal_notes
-- in particular is a private diary field — the app offers it as somewhere to
-- write whatever you want about your own belongings.
--
-- WHY THIS IS SAFE, checked the same way as step 4 — against the BUILT
-- website bundle, not the source:
--
--   * personal_notes is not requested anywhere on the website at all.
--   * purchase_date, love_rating and usage_frequency are requested only by
--     Insights, Declutter, CsvExport and ItemDetailSheet — all dashboard
--     screens, all behind sign-in, all therefore the `authenticated` role,
--     which this does not touch.
--   * original_price is deliberately NOT revoked: the public browse page
--     (PickleStyleSearch) does use it.
--   * The two public stat counters on /welcome used to ask for `*`, which a
--     column grant would refuse outright. They now count `id` instead, so
--     they are immune. That change ships with this SQL — deploy first.
--
-- The iOS app on people's phones is unaffected: it is signed in, so it is the
-- `authenticated` role.
-- ============================================================================

BEGIN;

REVOKE SELECT (personal_notes, purchase_date, love_rating, usage_frequency)
  ON public.inventory_items
  FROM anon;

COMMIT;

NOTIFY pgrst, 'reload schema';


-- ─── CHECKING IT ────────────────────────────────────────────────────────────
-- Not from the SQL editor — it connects as the service role and ignores all
-- of this. Tell me when it has run and I will re-measure from outside, the
-- same way the numbers above were measured.
--
-- ─── IF ANYTHING BREAKS ─────────────────────────────────────────────────────
-- GRANT SELECT (personal_notes, purchase_date, love_rating, usage_frequency)
--   ON public.inventory_items TO anon;
-- NOTIFY pgrst, 'reload schema';
--
-- ─── STILL OPEN AFTER THIS ──────────────────────────────────────────────────
-- A SIGNED-IN member can still read other people's personal_notes. Smaller —
-- it needs an account — but the same shape, and worth closing once the client
-- stops asking for columns it does not render.
