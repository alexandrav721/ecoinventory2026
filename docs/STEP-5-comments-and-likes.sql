-- ============================================================================
-- STEP 5 — COMMENTS AND LIKES SHOULD FOLLOW THE ITEM THEY ARE ON
--
-- Run AFTER step 4. Safe to run twice. Rollback at the bottom.
--
-- WHAT IS WRONG. Anyone on the internet can currently read:
--
--      6 comments   (including the text people wrote)
--     10 likes      (who liked what)
--
-- measured 28 Oct with the public key — on items they cannot see. You fixed
-- inventory_items so a friends-only item is private; its comments were left
-- behind, so the conversation about a private thing is public even though the
-- thing is not.
--
-- THE FIX IS DELIBERATELY NOT A COPY OF THE ITEM RULE. It just asks whether
-- the caller can see the item:
--
--     EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = …item_id)
--
-- A policy's subquery runs under the CALLER's permissions, so that EXISTS is
-- already filtered by the inventory_items policies you fixed in step 3. That
-- means these rules can never drift out of step with the item rules — change
-- what counts as a visible item once, and comments and likes follow. Writing
-- the public/friends logic out a second time here is exactly how the two
-- would end up disagreeing later.
--
-- You also always see your own comment or like, even on an item that has
-- since been made private — otherwise your own words vanish for you.
-- ============================================================================

BEGIN;

-- ── comments ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Comments follow their item" ON public.item_comments;
CREATE POLICY "Comments follow their item"
  ON public.item_comments
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.inventory_items i
       WHERE i.id = item_comments.item_id
    )
  );

-- ── likes ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Likes follow their item" ON public.item_likes;
CREATE POLICY "Likes follow their item"
  ON public.item_likes
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.inventory_items i
       WHERE i.id = item_likes.item_id
    )
  );

COMMIT;

NOTIFY pgrst, 'reload schema';


-- ─── IMPORTANT: THIS ONLY ADDS A NARROW RULE ────────────────────────────────
-- If a BROAD policy already exists on either table (something like
-- `USING (true)`), it is still there, and because permissive policies are
-- OR'ed together the leak stays open. Run step 2's listing again with
-- tablename swapped, and send me what it shows:
--
--   select tablename, policyname, cmd::text, coalesce(qual,'(none)')
--     from pg_policies
--    where schemaname='public'
--      and tablename in ('item_comments','item_likes','conversations')
--    order by tablename, policyname;
--
-- I will then give you the exact DROP for whatever broad rule is named, the
-- same way we did for inventory_items. I am NOT guessing at the name here,
-- because that is precisely the mistake that nearly let the first fix fail
-- silently while reporting success.
--
-- ─── DELIBERATELY NOT TOUCHED: conversations ────────────────────────────────
-- 33 conversation rows are readable (ids, item ids and timestamps — no
-- names, no message text; `messages` itself is correctly locked). The obvious
-- fix is to scope conversations to visible items too, and I have not written
-- it, because a conversation outlives the listing: if a buyer and seller are
-- mid-thread and the item is sold or made private, scoping it to the item
-- would delete the thread from both their screens. Doing it properly needs
-- the participant model, which is worth one careful look rather than a guess
-- tonight. Lower stake, genuinely still open.
--
-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- BEGIN;
-- DROP POLICY IF EXISTS "Comments follow their item" ON public.item_comments;
-- DROP POLICY IF EXISTS "Likes follow their item" ON public.item_likes;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
