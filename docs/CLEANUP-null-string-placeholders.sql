-- ============================================================================
-- inventory_items holds the literal four-character string 'null' in text
-- columns where it should hold SQL NULL. Nine values across six items on the
-- app's project right now. It reaches the eye: the website's browse grid
-- printed "NULL" above an item name and "Size null" beneath it.
--
-- RUN THIS ON THE APP'S PROJECT. The website's project is clean (checked —
-- see below). It rewrites production rows, so it is yours to run, not mine:
-- Supabase dashboard -> the project -> SQL Editor -> paste -> Run. It takes
-- a few seconds. It snapshots every row it touches first, so it is fully
-- reversible; rollback at the bottom.
--
--     app      taodxvqcgszqkqhtwkqt   <- THIS ONE. 9 bad values.
--     website  pxktgcwhisjdiquezvav   <- nothing to do; see "The other
--                                       project" at the bottom.
--
-- ─── MEASURED TODAY, 20 Oct 2026, with the app project's public key ─────────
--
-- Across the 22 inventory_items rows an anonymous client can read:
--
--     size         5 rows hold the string 'null'
--     dimensions   3 rows hold the string 'null'
--     brand        1 row  holds the string 'null'
--                 ──
--                  9 values, on 6 distinct items
--
--     Strappy Mini Dress           size='null'
--     White Bodycon Mini Dress     size='null'  dimensions='null'
--     Exercise Yoga Mat            size='null'  dimensions='null'
--     Samsung Flat Screen TV       size='null'  dimensions='null'
--     Decorative Storage Cabinet   size='null'  brand='null'
--
-- Every other text column on those 22 rows was checked in the same pass and
-- is clean: name, description, color, personal_notes, product_url, condition,
-- love_rating, usage_frequency, sharing_level, rent_window, tags[],
-- admin_hidden_reason. No 'undefined', no 'NaN', no empty strings either.
--
-- NOTE THE CEILING ON THAT NUMBER. 22 rows is what an anonymous key is
-- served, not what the table holds. Private items, unphotographed items and
-- items belonging to other accounts are not in the count. In the SQL editor
-- you are the service role and see all of it, so the before/after counts in
-- step 1 will almost certainly be HIGHER than 9. That is expected — same bug,
-- more of it. If step 1 reports columns that are not in the list above, the
-- UPDATE in step 3 already covers every text column, so just note it.
--
-- ─── WHY — the writer, proven, not guessed ──────────────────────────────────
--
-- The vision tool schema in the app's add-by-photo edge function contradicts
-- itself. ecoinventory-mobile/supabase/functions/analyze-item-photo/index.ts:
--
--     size: {                                                    (line 95)
--       type: "string",                   <-- JSON null FORBIDDEN
--       description: "Size if readable or visually obvious ...
--                     Null if not visible or not size-relevant."
--                                         <-- MODEL TOLD TO RETURN NULL
--     },
--
-- The field is typed as a plain string, so the tool call cannot carry a JSON
-- null. The description instructs the model to return null anyway. Told to
-- express "absent" through a channel that only accepts strings, the model
-- complies the one way the schema leaves open: the four characters n-u-l-l.
--
-- Then the insert takes it at face value (same file, lines 360-370):
--
--     brand:      item.brand ?? null,              -- 'null' passes through
--     color:      item.color?.trim() || null,      -- 'null'.trim() is truthy
--     size:       item.size?.trim() || null,       --   so it passes too
--     dimensions: item.dimensions?.trim() || null,
--
-- `?? null` only catches undefined. `.trim() || null` only catches empty and
-- whitespace. Neither looks at what the string says, and 'null' is a
-- perfectly ordinary non-empty string to both.
--
-- WHAT MAKES THIS THE CULPRIT AND NOT A THEORY: the damage tracks the
-- instruction, column by column. Every field in that schema is typed
-- "string". Only some of their descriptions tell the model to return null —
-- and those are exactly the columns with bad data, in order of how
-- unconditional the instruction is:
--
--   column       description says                                  bad rows
--   ───────────  ───────────────────────────────────────────────  ─────────
--   size         "Null if not visible or not size-relevant."           5
--   dimensions   "Null for small items where dimensions are
--                 pointless."                                         3
--   brand        "Only return null when you genuinely can't tell."     1
--   color        "Null ONLY if the item is genuinely multi-
--                 colored without a clear dominant ..."               0
--   description  (no null instruction at all)                          0
--   name         (no null instruction; always identifiable)            0
--
-- size and dimensions are absent on most items, so the instruction fires
-- often. brand is a required field the model can usually guess, so it fires
-- rarely. color's instruction is hedged with "only if", and never fired.
-- description and name were never told to return null and never did. The
-- columns that were told to say "null" are the columns that say "null".
--
-- Four paths carry it to the database. All four are the same root cause:
--
--   1. analyze-item-photo inserts the row itself            index.ts:357-378
--      (Add -> photo. The main add flow, and the one that did this damage.)
--   2. Fill with AI puts it in the form, user saves it
--      app/(tabs)/add.tsx:920 declares hasText() as "non-empty string", so
--      'null' passes the guard, lands in the text input, and is written back
--      by `size: size.trim() || null` at add.tsx:1667. Same in
--      app/edit-item/[id].tsx:591 and :850.
--   3. RoomSweep / camera-roll scan     src/lib/scanCameraRoll.ts:168, :342
--      reads the same edge function's `extracted` and saves it the same way.
--   4. inventory-assistant (chat "add my ...")    index.ts:220-225, 260
--      and parse-receipt-text (index.ts:243) repeat the typed-"string"
--      shape. parse-receipt-text's brand description even says "Brand if
--      obvious from product name, else null." Neither has produced a bad
--      row yet; both can.
--
-- RULED OUT: the website's own add/edit/CSV paths. Not just because they are
-- shaped the same way (`formData.size.trim() || null`, AddItem.tsx:266-269)
-- but because they write to a DIFFERENT PROJECT — VITE_SUPABASE_URL is
-- pxktgcwhisjdiquezvav, per docs/TWO-DATABASES.md and src/lib/schemaFlags.ts.
-- They cannot have written a row on taodxvqcgszqkqhtwkqt.
--
-- THE DISPLAY FIX IS NOT THIS FIX. src/lib/displayText.ts on the website
-- stops the website RENDERING 'null'. It does not clean the rows, it does not
-- stop the app writing them, and the app's own screens still show them. This
-- file cleans the rows. The schema fix is listed at the bottom and is NOT in
-- this file — I have not touched any app code.
--
-- ============================================================================


-- ─── STEP 1: COUNT, BEFORE ──────────────────────────────────────────────────
-- Run this ALONE first and keep the output. It is how you will know the
-- UPDATE did what it should, and it covers every text column on the table,
-- not just the three that are known to be dirty.

SELECT 'brand' AS column_name, count(*) AS bad_rows FROM public.inventory_items WHERE lower(btrim(brand))              IN ('null','undefined','nan','nil') OR btrim(brand)              = ''
UNION ALL SELECT 'color',               count(*) FROM public.inventory_items WHERE lower(btrim(color))              IN ('null','undefined','nan','nil') OR btrim(color)              = ''
UNION ALL SELECT 'size',                count(*) FROM public.inventory_items WHERE lower(btrim(size))               IN ('null','undefined','nan','nil') OR btrim(size)               = ''
UNION ALL SELECT 'dimensions',          count(*) FROM public.inventory_items WHERE lower(btrim(dimensions))         IN ('null','undefined','nan','nil') OR btrim(dimensions)         = ''
UNION ALL SELECT 'description',         count(*) FROM public.inventory_items WHERE lower(btrim(description))        IN ('null','undefined','nan','nil') OR btrim(description)        = ''
UNION ALL SELECT 'personal_notes',      count(*) FROM public.inventory_items WHERE lower(btrim(personal_notes))     IN ('null','undefined','nan','nil') OR btrim(personal_notes)     = ''
UNION ALL SELECT 'product_url',         count(*) FROM public.inventory_items WHERE lower(btrim(product_url))        IN ('null','undefined','nan','nil') OR btrim(product_url)        = ''
UNION ALL SELECT 'condition',           count(*) FROM public.inventory_items WHERE lower(btrim(condition))          IN ('null','undefined','nan','nil') OR btrim(condition)          = ''
UNION ALL SELECT 'love_rating',         count(*) FROM public.inventory_items WHERE lower(btrim(love_rating))        IN ('null','undefined','nan','nil') OR btrim(love_rating)        = ''
UNION ALL SELECT 'usage_frequency',     count(*) FROM public.inventory_items WHERE lower(btrim(usage_frequency))    IN ('null','undefined','nan','nil') OR btrim(usage_frequency)    = ''
UNION ALL SELECT 'sharing_level',       count(*) FROM public.inventory_items WHERE lower(btrim(sharing_level))      IN ('null','undefined','nan','nil') OR btrim(sharing_level)      = ''
UNION ALL SELECT 'rent_window',         count(*) FROM public.inventory_items WHERE lower(btrim(rent_window))        IN ('null','undefined','nan','nil') OR btrim(rent_window)        = ''
UNION ALL SELECT 'admin_hidden_reason', count(*) FROM public.inventory_items WHERE lower(btrim(admin_hidden_reason)) IN ('null','undefined','nan','nil') OR btrim(admin_hidden_reason) = ''
UNION ALL SELECT 'name (NOT NULL — see step 2)', count(*) FROM public.inventory_items WHERE lower(btrim(name))      IN ('null','undefined','nan','nil') OR btrim(name)               = ''
UNION ALL SELECT 'tags[] (array — see step 2)',  count(*) FROM public.inventory_items WHERE EXISTS (SELECT 1 FROM unnest(coalesce(tags,'{}')) t WHERE lower(btrim(t)) IN ('null','undefined','nan','nil') OR btrim(t) = '')
ORDER BY bad_rows DESC, column_name;

-- Expect size / dimensions / brand to be non-zero and at least 5 / 3 / 1.
-- Everything else was 0 on the rows I could see. A non-zero anywhere else is
-- still handled by step 3 — except name and tags, which step 2 covers.


-- ─── STEP 2: THE TWO COLUMNS THE UPDATE WILL NOT TOUCH ──────────────────────
-- Run these only if step 1 showed a non-zero count for them. Both need a
-- human decision, which is why they are not in the transaction below.
--
--   name is NOT NULL. It cannot be set to NULL, and a nameless item is worse
--   than a badly named one. Look at what these actually are and rename or
--   delete them by hand:
--
--     SELECT id, name, brand, image_urls, created_at
--       FROM public.inventory_items
--      WHERE lower(btrim(name)) IN ('null','undefined','nan','nil')
--         OR btrim(name) = ''
--      ORDER BY created_at DESC;
--
--   tags is text[]. A bad element has to be stripped from the array rather
--   than nulled, and an empty array is the right end state, not NULL. See
--   what is in there first:
--
--     SELECT id, name, tags FROM public.inventory_items
--      WHERE EXISTS (SELECT 1 FROM unnest(coalesce(tags,'{}')) t
--                     WHERE lower(btrim(t)) IN ('null','undefined','nan','nil')
--                        OR btrim(t) = '');
--
--   and if that returns rows, this strips just the bad elements and leaves
--   the good ones alone:
--
--     BEGIN;
--     UPDATE public.inventory_items i
--        SET tags = c.cleaned
--       FROM (
--         SELECT it.id,
--                coalesce(
--                  array_agg(t) FILTER (
--                    WHERE lower(btrim(t)) NOT IN ('null','undefined','nan','nil')
--                      AND btrim(t) <> ''
--                  ), '{}'::text[]
--                ) AS cleaned
--           FROM public.inventory_items it, unnest(it.tags) t
--          GROUP BY it.id
--       ) c
--      WHERE i.id = c.id
--        AND i.tags IS DISTINCT FROM c.cleaned;
--     COMMIT;
--
--   (Written as a join rather than the shorter correlated-subquery form on
--   purpose — this shape is unambiguous, and I had no Postgres to test the
--   other one against. Rows with tags = NULL or '{}' produce no rows in
--   unnest and are left alone, which is correct.)


-- ─── STEP 3: THE CLEANUP ────────────────────────────────────────────────────
-- Snapshot then update, in one transaction. If anything in here fails, the
-- whole thing rolls back and you are exactly where you started.
--
-- The snapshot goes in a `backups` schema, NOT in `public`. A table in public
-- is served by the REST API, and a fresh CREATE TABLE AS has no RLS on it —
-- putting item data there would hand anonymous clients a copy of rows they
-- are not allowed to read. PostgREST only exposes the schemas it is
-- configured for, so `backups` is unreachable from outside. Do not move it.

-- IF YOU ARE RUNNING THIS A SECOND TIME, the CREATE TABLE below will fail
-- because the snapshot already exists, and the whole transaction will roll
-- back having changed nothing. That is on purpose — it stops a re-run
-- overwriting the record of the first one. Rename the old snapshot (or drop
-- it, if you are done with it) and then run this again:
--   ALTER TABLE backups.inventory_items_null_strings_20261020
--     RENAME TO inventory_items_null_strings_20261020_first_run;

BEGIN;

CREATE SCHEMA IF NOT EXISTS backups;
REVOKE ALL ON SCHEMA backups FROM anon, authenticated;

-- Every row this migration is about to change, exactly as it is now.
CREATE TABLE backups.inventory_items_null_strings_20261020 AS
SELECT id, brand, color, size, dimensions, description, personal_notes,
       product_url, condition, love_rating, usage_frequency, sharing_level,
       rent_window, admin_hidden_reason, now() AS snapshot_at
  FROM public.inventory_items
 WHERE lower(btrim(brand))              IN ('null','undefined','nan','nil') OR btrim(brand)              = ''
    OR lower(btrim(color))              IN ('null','undefined','nan','nil') OR btrim(color)              = ''
    OR lower(btrim(size))               IN ('null','undefined','nan','nil') OR btrim(size)               = ''
    OR lower(btrim(dimensions))         IN ('null','undefined','nan','nil') OR btrim(dimensions)         = ''
    OR lower(btrim(description))        IN ('null','undefined','nan','nil') OR btrim(description)        = ''
    OR lower(btrim(personal_notes))     IN ('null','undefined','nan','nil') OR btrim(personal_notes)     = ''
    OR lower(btrim(product_url))        IN ('null','undefined','nan','nil') OR btrim(product_url)        = ''
    OR lower(btrim(condition))          IN ('null','undefined','nan','nil') OR btrim(condition)          = ''
    OR lower(btrim(love_rating))        IN ('null','undefined','nan','nil') OR btrim(love_rating)        = ''
    OR lower(btrim(usage_frequency))    IN ('null','undefined','nan','nil') OR btrim(usage_frequency)    = ''
    OR lower(btrim(sharing_level))      IN ('null','undefined','nan','nil') OR btrim(sharing_level)      = ''
    OR lower(btrim(rent_window))        IN ('null','undefined','nan','nil') OR btrim(rent_window)        = ''
    OR lower(btrim(admin_hidden_reason)) IN ('null','undefined','nan','nil') OR btrim(admin_hidden_reason) = '';

REVOKE ALL ON backups.inventory_items_null_strings_20261020 FROM anon, authenticated;

-- One pass. A row with a bad size AND a bad brand is fixed once, and
-- updated_at is deliberately left alone: this corrects a value that was
-- always meant to be absent, it is not the owner editing their item, and
-- bumping it would reorder "recently updated" for no reason.
UPDATE public.inventory_items SET
  brand              = CASE WHEN lower(btrim(brand))              IN ('null','undefined','nan','nil') OR btrim(brand)              = '' THEN NULL ELSE brand              END,
  color              = CASE WHEN lower(btrim(color))              IN ('null','undefined','nan','nil') OR btrim(color)              = '' THEN NULL ELSE color              END,
  size               = CASE WHEN lower(btrim(size))               IN ('null','undefined','nan','nil') OR btrim(size)               = '' THEN NULL ELSE size               END,
  dimensions         = CASE WHEN lower(btrim(dimensions))         IN ('null','undefined','nan','nil') OR btrim(dimensions)         = '' THEN NULL ELSE dimensions         END,
  description        = CASE WHEN lower(btrim(description))        IN ('null','undefined','nan','nil') OR btrim(description)        = '' THEN NULL ELSE description        END,
  personal_notes     = CASE WHEN lower(btrim(personal_notes))     IN ('null','undefined','nan','nil') OR btrim(personal_notes)     = '' THEN NULL ELSE personal_notes     END,
  product_url        = CASE WHEN lower(btrim(product_url))        IN ('null','undefined','nan','nil') OR btrim(product_url)        = '' THEN NULL ELSE product_url        END,
  condition          = CASE WHEN lower(btrim(condition))          IN ('null','undefined','nan','nil') OR btrim(condition)          = '' THEN NULL ELSE condition          END,
  love_rating        = CASE WHEN lower(btrim(love_rating))        IN ('null','undefined','nan','nil') OR btrim(love_rating)        = '' THEN NULL ELSE love_rating        END,
  usage_frequency    = CASE WHEN lower(btrim(usage_frequency))    IN ('null','undefined','nan','nil') OR btrim(usage_frequency)    = '' THEN NULL ELSE usage_frequency    END,
  sharing_level      = CASE WHEN lower(btrim(sharing_level))      IN ('null','undefined','nan','nil') OR btrim(sharing_level)      = '' THEN NULL ELSE sharing_level      END,
  rent_window        = CASE WHEN lower(btrim(rent_window))        IN ('null','undefined','nan','nil') OR btrim(rent_window)        = '' THEN NULL ELSE rent_window        END,
  admin_hidden_reason = CASE WHEN lower(btrim(admin_hidden_reason)) IN ('null','undefined','nan','nil') OR btrim(admin_hidden_reason) = '' THEN NULL ELSE admin_hidden_reason END
WHERE id IN (SELECT id FROM backups.inventory_items_null_strings_20261020);

COMMIT;

-- The row count the editor reports on that UPDATE is ITEMS changed, not
-- values changed. On the rows I could see it would say 6, for 9 values.


-- ─── STEP 4: CHECK IT ───────────────────────────────────────────────────────
-- Re-run the whole of STEP 1. Every count must now be 0, except possibly
-- `name` and `tags[]`, which step 3 does not touch on purpose.
--
-- Confirm the snapshot caught what it should — this should equal the number
-- of items the UPDATE reported:
--
--   SELECT count(*) FROM backups.inventory_items_null_strings_20261020;
--
-- Confirm nothing else moved. The clean values on those same rows must be
-- untouched; this should return no rows:
--
--   SELECT b.id, b.brand AS was_brand, i.brand AS now_brand,
--                 b.size  AS was_size,  i.size  AS now_size
--     FROM backups.inventory_items_null_strings_20261020 b
--     JOIN public.inventory_items i USING (id)
--    WHERE (b.brand IS DISTINCT FROM i.brand
--           AND lower(btrim(b.brand)) NOT IN ('null','undefined','nan','nil')
--           AND btrim(coalesce(b.brand,'x')) <> '')
--       OR (b.size IS DISTINCT FROM i.size
--           AND lower(btrim(b.size)) NOT IN ('null','undefined','nan','nil')
--           AND btrim(coalesce(b.size,'x')) <> '');
--
-- Then look with your eyes, which is where this started:
--   - the website's browse grid: no "NULL" heading, no "Size null"
--   - the app, Discover and your own loop: the size/dimensions lines on
--     those six items should now be absent rather than reading "null"
--   - open one of the six in the app's Edit screen: the Size field should be
--     empty, and the details accordion may now start collapsed, because
--     edit-item/[id].tsx:415 opens it only when a spec field is non-empty.
--     That is correct behaviour on a correct row.
--
-- KEEP THE SNAPSHOT for a week or two, then:
--   DROP TABLE backups.inventory_items_null_strings_20261020;


-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- Puts every value back exactly as it was. Only works while the snapshot
-- table still exists — so do not drop it until you are satisfied.
--
-- BEGIN;
-- UPDATE public.inventory_items i SET
--   brand = b.brand, color = b.color, size = b.size,
--   dimensions = b.dimensions, description = b.description,
--   personal_notes = b.personal_notes, product_url = b.product_url,
--   condition = b.condition, love_rating = b.love_rating,
--   usage_frequency = b.usage_frequency, sharing_level = b.sharing_level,
--   rent_window = b.rent_window, admin_hidden_reason = b.admin_hidden_reason
--   FROM backups.inventory_items_null_strings_20261020 b
--  WHERE i.id = b.id;
-- COMMIT;


-- ─── SHOULD A CONSTRAINT OR TRIGGER GUARD THIS? ─────────────────────────────
--
-- MY ANSWER: a CHECK constraint, yes — but only after the app is fixed and
-- shipped, and only after step 1 reads all zeros. Not a trigger.
--
-- WHY A CHECK AND NOT A TRIGGER. A trigger that silently rewrites 'null' to
-- NULL would make this bug invisible: the rows would look right, the schema
-- would stay wrong, and nobody would ever find out that the vision tool is
-- still being told to return null into a string field. A CHECK constraint
-- fails the write instead. The edge function already surfaces insert errors
-- to the client ("Could not save item: ...", analyze-item-photo index.ts:384)
-- so a violation would show up as a visible, reported failure the first time
-- it happened, which is what you want from a backstop.
--
-- WHY NOT YET. The constraint is validated against existing rows the moment
-- you add it, so it will simply fail while any bad row remains. And if the
-- app is still writing 'null' when you add it, you have converted a cosmetic
-- bug into "users cannot add items from a photo". Order matters: clean the
-- rows (this file), fix the app and ship it, confirm zero, then constrain.
--
-- WHEN ALL THREE ARE TRUE, this is the one to add:
--
--   ALTER TABLE public.inventory_items
--     ADD CONSTRAINT inventory_items_no_placeholder_text CHECK (
--          (brand          IS NULL OR lower(btrim(brand))          NOT IN ('null','undefined','nan','nil'))
--      AND (color          IS NULL OR lower(btrim(color))          NOT IN ('null','undefined','nan','nil'))
--      AND (size           IS NULL OR lower(btrim(size))           NOT IN ('null','undefined','nan','nil'))
--      AND (dimensions     IS NULL OR lower(btrim(dimensions))     NOT IN ('null','undefined','nan','nil'))
--      AND (description    IS NULL OR lower(btrim(description))    NOT IN ('null','undefined','nan','nil'))
--      AND (personal_notes IS NULL OR lower(btrim(personal_notes)) NOT IN ('null','undefined','nan','nil'))
--     );
--
--   -- to undo:
--   -- ALTER TABLE public.inventory_items
--   --   DROP CONSTRAINT inventory_items_no_placeholder_text;
--
-- It deliberately does NOT check for the empty string. Empty is harmless —
-- every client already treats '' as absent and the grid does not render it —
-- and failing a write over it would be a new way to break saving. This file
-- nulls empties because they are untidy, not because they are dangerous.
--
-- THE ACTUAL FIX IS IN THE APP, AND IT IS NOT IN THIS FILE. I have changed no
-- app code. Three things, in ecoinventory-mobile, smallest first:
--
--   1. The schema contradiction, which is the bug itself. In
--      analyze-item-photo/index.ts, give every nullable field a type that can
--      hold null — `type: ["string", "null"]` on brand (63), description
--      (74), color (90), size (95), dimensions (100) — so the model has a
--      real null to return and stops spelling it out. Same shape in
--      inventory-assistant (57-69, 117-129) and parse-receipt-text (54).
--   2. A placeholder filter on the way in, because a model can always
--      surprise you. extract-product-from-url already has the right idea in
--      its clean() at index.ts:209; it just needs to reject placeholder
--      words too, and then be used by the other three functions.
--   3. hasText() in add.tsx:920 and edit-item/[id].tsx:591 should reject
--      placeholder strings as well as empty ones, so Fill with AI cannot put
--      'null' into a text input for the user to unknowingly save.
--
-- Until 1 and 2 ship, the add-by-photo flow will keep writing these rows and
-- this file will need running again.
--
-- ─── THE OTHER PROJECT ──────────────────────────────────────────────────────
-- The website's project, pxktgcwhisjdiquezvav, had no placeholder values in
-- any text column when I checked it. Its write paths cannot have caused this
-- (different project, and the app's edge functions do not run against it).
-- There is nothing to run there. If you want the reassurance, run STEP 1
-- against it — it is a read-only query and should come back all zeros.
