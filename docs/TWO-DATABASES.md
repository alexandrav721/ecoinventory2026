# The website and the app are on two different databases

**This is the one thing from today that you have to decide, and it is the
reason "change it on the website and it shows up in Loop" has never
worked.** Everything else I did today was fixing the website lying or
leaking, which it would have done against either database. This is the
premise underneath the whole request, and I had it wrong until early
afternoon.

```
app      taodxvqcgszqkqhtwkqt.supabase.co    EXPO_PUBLIC_SUPABASE_URL
                                             ecoinventory-mobile/.env
website  pxktgcwhisjdiquezvav.supabase.co    VITE_SUPABASE_URL
                                             ecoinventory2026/.env
```

Two Supabase projects. Separate schemas, separate rows, separate
accounts, separate passwords. An item you add on your phone cannot appear
on the website, and a sign-in that works on one will not work on the
other. No code change makes these one thing.

## What is actually in each, measured today

Read with each project's own public key, so these are the rows a visitor
can see; RLS hides some counts, which is why a few say "exists".

| table | app project | website project |
|---|---|---|
| inventory_items | 22 | 32 |
| profiles | 12 | 10 |
| follows | **15** | 1 |
| conversations | **33** | 0 |
| friendships | 0 | 0 |
| messages / notifications | 0 | 0 |
| swap_offers | 0 | 0 |

The table *set* is nearly identical — both have `mutes`, `wants`,
`kits`, `invites`, `transactions`, `item_dispositions`, `swap_offers`.
What differs is where the life is. The app's project has 33 conversations
and 15 follows: people have actually used it. The website's project has
one follow and no conversations, and its 32 items are a curated set —
Le Creuset, Vitamix, Aesop, Diptyque, a Leica Q2 — which reads as seed
content rather than anything a neighbour typed.

The app's project is also **ahead on schema**: `rent_price`,
`rent_window` and `admin_hidden` exist there and not on the website's.
That is what broke /community for twenty minutes this afternoon when I
assumed one database.

## My recommendation: point the website at the app's project

The app is the product. It is what goes to the App Store, it is what
TestFlight build 69 is running against, and it holds the real accounts
and conversations. The website is the companion surface. So the website
should move to the app's database, not the other way round.

That also means the website inherits a schema that is already ahead,
rather than needing the migration in `MIGRATION-rent-columns.sql`.

### What it takes

1. **Get the app project's anon key.** Supabase dashboard →
   `taodxvqcgszqkqhtwkqt` → Project Settings → API → `anon` `public`.
   It is the same value as `EXPO_PUBLIC_SUPABASE_ANON_KEY` in
   `ecoinventory-mobile/.env`, so you can copy it from there.

2. **Change three values** in `ecoinventory2026/.env`:
   ```
   VITE_SUPABASE_PROJECT_ID   = taodxvqcgszqkqhtwkqt
   VITE_SUPABASE_URL          = https://taodxvqcgszqkqhtwkqt.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = <that anon key>
   ```
   And the same three in Cloudflare Pages → the project → Settings →
   Environment variables, or the deployed site keeps using the old ones.
   `.env` is gitignored, so this never lands in a commit.

3. **Regenerate the website's types** so they describe the project it is
   now talking to:
   ```bash
   npx supabase gen types typescript --project-id taodxvqcgszqkqhtwkqt > src/integrations/supabase/types.ts
   ```
   Then set `RENT_COLUMNS_PRESENT` and `ADMIN_HIDDEN_COLUMN_PRESENT` to
   `true` in `src/lib/schemaFlags.ts`, and add `rent_price, rent_window`
   back to the four selects marked with
   `/* + rent_price, rent_window when RENT_COLUMNS_PRESENT */`.

4. **Check the website's own tables came along.** Both projects have the
   same table names, but I could only count rows, not compare columns.
   Before trusting it, open /community, /people, a profile, /swap and the
   dashboard on the new database and watch the browser console for
   `400 ... does not exist`. That error names the missing column exactly,
   which is how this afternoon's break was found.

### What you lose

The website project's 32 seed items and 10 profiles. If any of those are
real — someone you invited who signed up on the web — they would need to
sign up again on the app's project. **Check that before you switch**:
`profiles` there has 10 rows, and you will recognise whether they are
yours or seeded.

If some are real, the alternative is a one-off data migration (export
those rows, insert them into the app's project with new user ids), which
is more work and worth doing only if real people are in there.

## Do nothing, option B

Keep two databases and run `MIGRATION-rent-columns.sql` on the website's
project so at least the schemas match. The website then still cannot show
anything from the app. This is only worth it if you want the website to
be a separate marketing/demo surface rather than a second way into Loop —
which, given you asked for the opposite this morning, I do not think is
what you want.

## Why I did not just do it

Repointing the live website at a different production database is not a
code change; it changes which accounts exist and which data the public
site serves. It needs the anon key, a Cloudflare settings change, and a
decision about those 10 profiles. All three are yours.
