-- ============================================================================
-- Friends-only items are readable by anyone, including signed-out visitors.
--
-- RUN THIS YOURSELF. It changes a production security policy, so it is not
-- something I will apply for you. Supabase dashboard -> SQL Editor -> paste
-- -> Run. It is additive and reversible (the rollback is at the bottom).
--
-- STATUS AS OF 20 Oct 2026, measured against your live database with the
-- public anon key:
--
--     rows an anonymous client can read : 32
--     of those, sharing_level = public  : 32
--     friends / private / public_anon   : 0
--
-- So NOTHING HAS LEAKED. Every shared row in there today is genuinely
-- public. This is a loaded gun, not a fired one — and it fires the first
-- time any user picks "Friends only".
--
-- WHY. The only cross-user SELECT policy on inventory_items is:
--
--     CREATE POLICY "Users can view items available for sharing"
--       ON public.inventory_items FOR SELECT
--       USING ((is_available_for_sharing = true));
--
-- and BOTH add flows set is_available_for_sharing = true for "Friends only"
-- exactly as they do for "Public":
--
--     ecoinventory2026/src/pages/AddItem.tsx:294
--       is_available_for_sharing: formData.sharing_level !== "private"
--     ecoinventory-mobile/app/(tabs)/add.tsx:1629
--       is_available_for_sharing: !availabilityFlags.isPrivate
--
-- The policy never looks at sharing_level. So a friends-only row satisfies
-- it, and Postgres will hand that row to any client that asks — the iPhone
-- app only looks safe because it filters afterwards in JavaScript
-- (src/lib/itemVisibility.ts). The website now does the same filtering, so
-- neither surface DISPLAYS these rows any more. But a filter in a client
-- someone can edit is not a privacy guarantee. This policy is.
--
-- WHAT IT DOES. Replaces that one policy with the same rule the two clients
-- already apply: public and public_anon to everyone; friends-only to
-- accepted friends in either direction; private to nobody. The separate
-- "Users can view own items" policy is untouched, so you always see all of
-- your own things.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Users can view items available for sharing"
  ON public.inventory_items;

CREATE POLICY "Shared items respect sharing_level"
  ON public.inventory_items
  FOR SELECT
  USING (
    is_available_for_sharing = true
    AND (
      -- Everyone, including signed-out visitors. public_anon is just as
      -- public; what it hides is the OWNER's name, not the item.
      sharing_level IN ('public', 'public_anon')

      -- Accepted friends, either direction, matching how both clients read
      -- the friendships table (status = 'accepted', user_id OR friend_id).
      OR (
        sharing_level = 'friends'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.friendships f
          WHERE f.status = 'accepted'
            AND (
              (f.user_id = auth.uid() AND f.friend_id = inventory_items.user_id)
              OR
              (f.friend_id = auth.uid() AND f.user_id = inventory_items.user_id)
            )
        )
      )
    )
  );

COMMIT;

-- ─── CHECK IT, right after running ──────────────────────────────────────────
-- Expect 32 (or whatever your public count is) and then 0:
--
--   SELECT count(*) FROM public.inventory_items
--    WHERE is_available_for_sharing AND sharing_level IN ('public','public_anon');
--
--   SELECT count(*) FROM public.inventory_items
--    WHERE is_available_for_sharing AND sharing_level NOT IN ('public','public_anon');
--
-- Then open /community signed out: the grid should look unchanged, because
-- today every shared row is public. That is the point — this costs you
-- nothing now and closes the hole before it matters.

-- ─── ROLLBACK, if anything looks wrong ──────────────────────────────────────
-- BEGIN;
-- DROP POLICY IF EXISTS "Shared items respect sharing_level" ON public.inventory_items;
-- CREATE POLICY "Users can view items available for sharing"
--   ON public.inventory_items FOR SELECT USING ((is_available_for_sharing = true));
-- COMMIT;

-- ─── STILL OPEN AFTER THIS ──────────────────────────────────────────────────
-- Blocking (the `mutes` table) is enforced only in client code, in both the
-- app and now the website. A blocked person's listings are hidden by the
-- clients but still served by the database. Same shape of problem, smaller
-- stake, and it needs a policy of its own — worth doing, not urgent.
