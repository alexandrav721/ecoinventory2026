-- ============================================================================
-- STEP 3 — "FRIENDS ONLY" ACTUALLY MEANS FRIENDS ONLY
--
-- Run this AFTER step 2, which is what made it safe to write. Paste it all,
-- press Run, expect "Success. No rows returned".
--
-- Safe to run twice: the new policy is dropped before it is created, so a
-- repeat run cannot throw "42710 policy already exists".
--
-- ─── WHAT STEP 2 TOLD US, AND WHY THIS IS NOW SMALL ─────────────────────────
--
-- The live policy list confirmed three things that the repo's .sql files
-- could not be trusted for:
--
--   1. The policy to remove really is named exactly
--      "Users can view items available for sharing", with the rule
--      (is_available_for_sharing = true) — no mention of sharing_level. That
--      is the leak: it hands any shared row to anybody, friends-only ones
--      included.
--
--   2. "Friends can view shared items" ALREADY EXISTS and is already correct:
--        (is_available_for_sharing = true)
--        AND (sharing_level = 'friends')
--        AND are_friends(auth.uid(), user_id)
--      So the friends case needs no new SQL at all. It has simply never
--      mattered until now, because the broad policy above was already letting
--      everyone through.
--
--   3. "Users can view own items" (auth.uid() = user_id) EXISTS, so you keep
--      seeing all of your own things, private ones included.
--
-- Permissive policies are OR'ed together, so removing the broad one can only
-- ever REDUCE what is visible. It cannot hide anything that one of the other
-- policies above still covers.
--
-- Measured from outside with the public key, 28 Oct: 22 rows readable by an
-- anonymous caller — 14 'public' and 8 'friends'. Also measured: 0 rows
-- readable where is_available_for_sharing is false or null, which proves
-- hide_admin_hidden_items is RESTRICTIVE and is not granting access on its own.
--
-- AFTER THIS RUNS that 22 should become 14. I can check that from outside;
-- the SQL editor cannot, because it connects as the service role and ignores
-- row-level security entirely.
-- ============================================================================

BEGIN;

-- Idempotency guard: makes a second run harmless instead of a red error.
DROP POLICY IF EXISTS "Public items are viewable"
  ON public.inventory_items;

-- The leak itself. Step 2 confirmed this exact spelling, so this cannot
-- silently miss.
DROP POLICY IF EXISTS "Users can view items available for sharing"
  ON public.inventory_items;

-- Its replacement: public means public, and nothing else.
-- public_anon is just as public — what it hides is the OWNER's name, not the
-- item — so it belongs here too. Friends-only is deliberately NOT handled
-- here; the existing "Friends can view shared items" policy does that.
CREATE POLICY "Public items are viewable"
  ON public.inventory_items
  FOR SELECT
  USING (
    is_available_for_sharing = true
    AND sharing_level IN ('public', 'public_anon')
  );

COMMIT;


-- ─── WHAT CHANGES THAT YOU CAN SEE ──────────────────────────────────────────
--
-- Almost nothing, because both clients were already filtering in JavaScript.
-- Two real exceptions, both arguably correct:
--
--   GROUPS. group_items() is SECURITY INVOKER, so it obeys these policies. A
--   group member who is NOT an accepted friend will stop seeing a fellow
--   member's friends-only items in the group grid.
--
--   ITEMS WITH NO SHARING LEVEL. A row with sharing_level NULL or 'private'
--   but is_available_for_sharing = true becomes owner-only. None exist among
--   today's shared rows. app/quests/card.tsx can create them, which is being
--   fixed separately.
--
-- ─── ROLLBACK (restores the leak — only if friends report missing items) ────
-- BEGIN;
-- DROP POLICY IF EXISTS "Public items are viewable" ON public.inventory_items;
-- CREATE POLICY "Users can view items available for sharing"
--   ON public.inventory_items FOR SELECT USING ((is_available_for_sharing = true));
-- COMMIT;
--
-- ─── STILL OPEN AFTER THIS ──────────────────────────────────────────────────
-- Blocking (`mutes`) is enforced only in client code. A blocked person's
-- listings are hidden by the app and site but still served by the database.
-- Smaller stake, needs its own policy.
