-- ============================================================================
-- "Friends only" is not enforced by either database. Eight real items are
-- publicly readable on the app's project right now.
--
-- RUN THIS ON BOTH PROJECTS, APP FIRST. It changes a production security
-- policy, so it is yours to run, not mine: Supabase dashboard -> the project
-- -> SQL Editor -> paste -> Run. Additive and reversible; rollback at the
-- bottom. It takes under a minute per project.
--
--     app      taodxvqcgszqkqhtwkqt   <- DO THIS ONE FIRST. Live exposure.
--     website  pxktgcwhisjdiquezvav   <- nothing exposed yet; close it anyway
--
-- ─── MEASURED TODAY, 20 Oct 2026, with each project's own public key ────────
--
-- APP PROJECT (taodxvqcgszqkqhtwkqt) — what an anonymous client gets:
--
--     22 rows readable
--        14  sharing_level = public
--         8  sharing_level = friends     <-- THESE SHOULD NOT BE READABLE
--
-- Eight items somebody marked "Friends only" are being served to anybody who
-- asks. Names, photos, descriptions, prices, owner ids. Also visible to that
-- same anonymous client: 2 items with no photo and 8 that were never offered
-- for anything, both of which the app hides too.
--
-- WEBSITE PROJECT (pxktgcwhisjdiquezvav):
--
--     32 rows readable, all 32 public, all photographed, all offered.
--
-- So nothing has leaked there — but only because nobody has picked "Friends
-- only" on that database yet. Same policy, same hole, no rows in it.
--
-- ─── WHY ────────────────────────────────────────────────────────────────────
--
-- The only cross-user SELECT policy on inventory_items is:
--
--     CREATE POLICY "Users can view items available for sharing"
--       ON public.inventory_items FOR SELECT
--       USING ((is_available_for_sharing = true));
--
-- It never looks at sharing_level. And BOTH add flows set
-- is_available_for_sharing = true for "Friends only" exactly as they do for
-- "Public":
--
--     ecoinventory-mobile/app/(tabs)/add.tsx:1629
--       is_available_for_sharing: !availabilityFlags.isPrivate
--     ecoinventory2026/src/pages/AddItem.tsx:294
--       is_available_for_sharing: formData.sharing_level !== "private"
--
-- So a friends-only row satisfies the policy and Postgres hands it over.
--
-- THE IPHONE APP STILL BEHAVES CORRECTLY — it filters in JavaScript, in
-- src/lib/itemVisibility.ts. As of today so does the website; that was most
-- of this afternoon. But a filter in a client is a courtesy, not a
-- guarantee: the anon key ships inside the app bundle, so anyone can make
-- the same request without the app. The policy below is the guarantee.
--
-- ─── WHAT IT DOES ───────────────────────────────────────────────────────────
--
-- Replaces that one policy with the rule the two clients already apply:
-- public and public_anon to everyone, friends-only to accepted friends in
-- either direction, private to nobody. The separate "Users can view own
-- items" policy is untouched, so you always see all of your own things.
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
      -- Everyone, signed-out visitors included. public_anon is just as
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
-- In the SQL editor you are the service role and see everything, so these
-- show what EXISTS, not what a visitor gets:
--
--   SELECT sharing_level, count(*) FROM public.inventory_items
--    WHERE is_available_for_sharing GROUP BY 1 ORDER BY 2 DESC;
--
-- On the app's project that should still show 14 public and 8 friends. The
-- real test is from outside: open /community signed out on the website, and
-- open Discover in the app signed in. Both should look exactly as they did
-- before — the clients were already filtering, so a correct policy changes
-- nothing you can see. That is the point.
--
-- If the app's Discover suddenly shows FEWER of a friend's items than it
-- did, the friendships rows are not 'accepted' in the direction you expect;
-- roll back and tell me before anything else.
--
-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- BEGIN;
-- DROP POLICY IF EXISTS "Shared items respect sharing_level" ON public.inventory_items;
-- CREATE POLICY "Users can view items available for sharing"
--   ON public.inventory_items FOR SELECT USING ((is_available_for_sharing = true));
-- COMMIT;
--
-- ─── STILL OPEN AFTER THIS ──────────────────────────────────────────────────
-- Blocking (`mutes`) is enforced only in client code, in the app and now on
-- the website too. A blocked person's listings are hidden by the clients but
-- still served by the database. Same shape, smaller stake, needs its own
-- policy. Worth doing; not today's fire.
