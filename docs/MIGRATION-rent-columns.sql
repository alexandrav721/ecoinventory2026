-- ============================================================================
-- Add rent_price and rent_window to the WEBSITE's project.
--
-- ONLY RUN THIS IF you are keeping the two databases separate. If you point
-- the website at the app's project instead (see TWO-DATABASES.md, which is
-- what I would do), that project already has these columns and this file is
-- unnecessary.
--
-- RUN IT YOURSELF: Supabase dashboard -> project pxktgcwhisjdiquezvav ->
-- SQL Editor -> paste -> Run. Additive and reversible; the rollback is at
-- the bottom.
--
-- WHAT AND WHY. rent_price holds the rate for ONE window and rent_window
-- names the window. The app has had both since its migration
-- 20260711000000_rent_window.sql; the website's project never got it, so
-- the website cannot store a paid rental at all and anything listed from the
-- web reads as a free lend.
--
-- The CHECK is the important part. rent_price alone is ambiguous and
-- dangerous: the same "250" is $250 or $7,500 for a month depending on a
-- column, so an unrecognised window must never be stored. Six values, and
-- NULL for "no rate set".
-- ============================================================================

BEGIN;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS rent_price  numeric,
  ADD COLUMN IF NOT EXISTS rent_window text;

-- Named so it can be dropped cleanly below.
ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_rent_window_check;

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_rent_window_check
  CHECK (
    rent_window IS NULL
    OR rent_window IN ('day', 'weekend', 'week', 'month', 'season', 'event')
  );

COMMIT;

-- ─── AFTER RUNNING ──────────────────────────────────────────────────────────
-- Both should return 0, because nothing has set a rate yet:
--
--   SELECT count(*) FROM public.inventory_items WHERE rent_price IS NOT NULL;
--   SELECT count(*) FROM public.inventory_items WHERE rent_window IS NOT NULL;
--
-- Then in the website repo:
--   1. src/lib/schemaFlags.ts -> RENT_COLUMNS_PRESENT = true
--   2. add `rent_price, rent_window` back to the four selects marked
--      /* + rent_price, rent_window when RENT_COLUMNS_PRESENT */
--   3. regenerate types:
--      npx supabase gen types typescript --project-id pxktgcwhisjdiquezvav \
--        > src/integrations/supabase/types.ts
--   4. npx tsc -p tsconfig.app.json --noEmit   (NOT `tsc --noEmit` — the root
--      tsconfig has "files": [] and checks nothing)
--
-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- BEGIN;
-- ALTER TABLE public.inventory_items
--   DROP CONSTRAINT IF EXISTS inventory_items_rent_window_check;
-- ALTER TABLE public.inventory_items
--   DROP COLUMN IF EXISTS rent_price,
--   DROP COLUMN IF EXISTS rent_window;
-- COMMIT;
