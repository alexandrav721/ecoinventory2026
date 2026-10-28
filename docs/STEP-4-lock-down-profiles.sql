-- ============================================================================
-- STEP 4 — STOP HANDING OUT EMAILS, HOME LOCATIONS AND PUSH TOKENS
--
-- SAFE TO RUN NOW. Nothing has to ship first.
--
--    I verified this against the BUILT website bundle rather than the source,
--    which matters: the one component that read other people's coordinates
--    turned out to be dead code that nothing imports and that never ships.
--    The live site asks profiles for only these columns —
--    age, avatar_url, city, email, friends_avatar_url, friends_display_name,
--    full_name, gender, id, interests, public_avatar_url,
--    public_display_name, state — and every one of the sensitive ones is on
--    a signed-in screen. Rollback at the bottom is instant regardless.
--
-- WHAT IS WRONG RIGHT NOW. Anyone on the internet, using the public key that
-- ships inside your iOS app, can download your whole profiles table:
--
--      12 email addresses      every user you have
--      10 real names
--       7 home GPS coordinates accurate to about a metre
--       7 push tokens          could be used to push to those phones
--       3 birth years
--
-- Measured 28 Oct with the public key. Counts only — no values were read.
--
-- This is the same shape as the friends-only bug you already fixed: a broad
-- grant that never checks the column meant to gate it. Your table even has
-- `location_visible_to_public`, `public_display_name` and `public_avatar_url`
-- built specifically to keep this from happening. Nothing consults them.
--
-- WHY IT IS SAFE FOR THE APP ON YOUR PHONE. This changes the `anon` role
-- only — signed-out callers. Signed-in users are the `authenticated` role
-- and are untouched, so the iOS app already on people's phones keeps working
-- exactly as before. I checked every place either codebase reads these
-- columns: all 24 are own-profile, friends, settings or admin screens, which
-- are all signed in.
--
-- WHAT STAYS PUBLIC. Only what a logged-out visitor's screen actually draws:
-- the display name, avatar and city shown next to a listing.
-- ============================================================================

BEGIN;

-- Remove the blanket table-wide read for signed-out callers.
REVOKE SELECT ON public.profiles FROM anon;

-- Give back only the columns a public page renders. Any column NOT named
-- here is now unreadable without signing in — email, latitude, longitude,
-- push_token, phone_e164, pickup_address, stripe_account_id, birth_year,
-- age, gender, the hashes, and everything else.
GRANT SELECT (
  id,
  public_display_name,
  public_avatar_url,
  friends_display_name,
  friends_avatar_url,
  avatar_url,
  full_name,
  city,
  state
) ON public.profiles TO anon;

COMMIT;

-- Make the API layer pick the change up immediately rather than in a minute.
NOTIFY pgrst, 'reload schema';


-- ─── CHECKING IT ────────────────────────────────────────────────────────────
-- You cannot check this one from the SQL editor: it connects as the service
-- role, which ignores all of this and will happily show you every column.
-- Tell me when it has run and I will re-measure from outside, the same way I
-- measured the numbers above. Expect: email unreadable, coordinates
-- unreadable, push tokens unreadable, display names and cities still fine.
--
-- ─── IF THE SITE BREAKS, PUT IT BACK INSTANTLY ──────────────────────────────
-- GRANT SELECT ON public.profiles TO anon;
-- NOTIFY pgrst, 'reload schema';
--
-- ─── WHAT THIS DOES *NOT* FIX, SO YOU KNOW ──────────────────────────────────
-- 1. A SIGNED-IN user can still read other people's email addresses and
--    coordinates. Smaller — it needs an account — but still wrong, and it is
--    the next one to close. It needs client changes first, so it is not a
--    one-liner like this.
-- 2. `full_name` stays public, because four pages still fall back to it when
--    someone has not set a display name. Your real name beside your city is a
--    much smaller exposure than your GPS coordinates, but the right end state
--    is public_display_name only.
-- 3. `location_visible_to_public` is still ignored by the database. Once
--    coordinates move behind a server-side distance function, that flag
--    should be what decides.
