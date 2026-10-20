# Today — making the app and the website agree

**The live preview:** https://loop-web-preview.pages.dev
celebrateloop.com is untouched; this is a separate Cloudflare project.

---

## Read this part first

You asked for the app and the website to coincide. **They can't yet, and
it isn't a code problem.** They read two different Supabase projects:

```
app      taodxvqcgszqkqhtwkqt.supabase.co
website  pxktgcwhisjdiquezvav.supabase.co
```

Separate schemas, separate rows, separate accounts. An item you add on
your phone is not in the database the website reads, and never was. I had
assumed one database until early afternoon, and I was wrong.

**`docs/TWO-DATABASES.md`** has what's in each (measured, side by side),
my recommendation — point the website at the app's project, because the
app holds the real accounts and 33 conversations while the website's 32
items are seed content — and the exact steps. It needs the anon key, a
Cloudflare settings change and a decision about 10 profiles, so it's
yours to do, not mine.

## And this part, today rather than this week

**Eight items somebody marked "Friends only" are readable by anyone
right now, on the app's database.** Names, photos, descriptions, prices.
I measured it with the app's own public key, the one that ships inside
the app bundle.

The iPhone app looks correct because it filters in JavaScript. That's a
courtesy, not a guarantee — anyone can make the same request without the
app. The only cross-user read policy on `inventory_items` is
`is_available_for_sharing = true`, and it never looks at
`sharing_level`, while both add screens set that flag for "Friends only"
exactly as they do for "Public".

**`docs/RLS-FIX-friends-only.sql`** — paste into the Supabase SQL editor,
app project first, then the website's. Under a minute each. It has the
check queries and a rollback. When it's right, nothing you can see
changes, because both clients were already filtering. That's the point.

---

## What I actually changed

### The website was showing other people's private things

Every live query that reads other people's rows now goes through the
app's own visibility rule, ported byte-identical (`src/lib/itemVisibility.ts`).
Before today, none of them did:

- **/community and /marketplace** selected eleven columns and not one of
  them was `sharing_level`. The word didn't appear in the file. Those
  pages have no sign-in wall, so every friends-only item in that database
  was on a public web page under a heading inviting people to browse
  freely.
- **/marketplace/item/:id** — the most shareable URL on the site —
  rendered a friends-only item in full, with the owner's name and city,
  to anyone holding the link.
- **A public profile** carried a comment saying it filtered three
  different ways by viewer. The query did one thing, unconditionally.
- **A friend's profile has never shown a single item**, since the column
  was renamed. It asks for `image_url`; the column is `image_urls`. The
  error was swallowed and the page said "hasn't shared any items yet".
- **Blocking someone in the app did nothing on the website** — the word
  "mutes" wasn't in the codebase.

Three knock-on fixes came free from using the real rule: free giveaways
reappear in browse (the website was excluding them — in this schema
`is_donated` means "offered free", not "already gone"), photoless items
stop showing as grey "No photo" tiles, and things you catalogued but
never listed stop being advertised as "Free to borrow".

### The Declutter deck was dealing out other people's belongings

No `user_id` filter at all. "Donate" on a stranger's sofa issued an
UPDATE against their row — rejected by the write policy, which is the
only reason this was embarrassing rather than destructive.

### Numbers that weren't true

- The dashboard said **"42 items added"** above a list of twelve.
- It counted `sum(quantity)`, so one record collection of 50 counted as
  50 things there and 1 thing everywhere else. The app counts rows.
- The Opportunities panel asserted **"Excess: 12 coffee cups"** for a
  demo household that owns no cups, plus three other invented findings.
  It now runs the real analysis over the real demo inventory and finds
  one true thing: "1 thing could sell for about $34" — the three-year-old
  tent, marked rarely used.
- Resale value was a flat **60% of what you paid**. The app uses
  condition × category × age. On a six-year-old $2,000 laptop the app
  says $144 and the website said $1,200, next to a button. The app's
  model is ported now; I checked 23 cases produce identical numbers.
- The people directory promised twelve items on a card whose profile
  showed three.
- The landing page's "Items catalogued" was a number a browser can't
  compute — it came back as exactly the shared count for a visitor and
  grew by your own private rows when you were signed in. One figure, two
  labels, same number.
- The invite dialog's "N items available to borrow **near you**" has no
  location in it and never did.

### Things the website claimed on your users' behalf

- **Purchase date**: a blank field was saved as today. Permanently, and
  it feeds the valuation, so a five-year-old item was priced as new.
- **Condition**: defaulted to "Good" and was written whether or not you
  touched it — including six AI/bulk paths, one hardcoded with no input.
  Editing an app item on the web stamped "Good" onto a row whose owner
  had deliberately left it blank. Blank is a real value now and the
  picker says "Not said".
- **Usage frequency**: the website offered *frequent / occasional / rare*;
  the app's words are *weekly / monthly / rarely / never*. Only "daily"
  was in both, and the app nulls anything it doesn't recognise — so
  marking something "Rare" on the web showed nothing on the phone, and
  the next phone save erased it.

### Rent, on both surfaces

The app has six rent windows and renders them correctly everywhere — but
**no screen could ever set one.** Both the add and edit screens said
"Rent / day" and saved the price alone, so every rental Loop has created
is per-day, and an item priced monthly showed its own owner "Rent / day"
over the monthly rate. Per-day is also the wrong default for "stuff you
only need for a while": baby gear goes by the month, holiday decor by the
season, a suit for one event.

Both app screens now show the six windows as chips and label the price
with the chosen one. The website has the same control — **inert**, because
the website's database doesn't have the column. One constant in
`src/lib/schemaFlags.ts` turns it on once you've either run
`docs/MIGRATION-rent-columns.sql` or moved the website to the app's
project, which already has it.

### Smaller, still real

- Invite links from the website pointed at
  `ecoinventory2026.lovable.app`. The app sends them to
  `celebrateloop.com/invite`, which is why `/invite/:token` is routed here.
- Browse labelled a paid rental "Free to borrow" and put a "Buy" chip on
  it, because it read the sale price instead of the three flags that say
  what an item is offered for. It uses the app's own wording now,
  including "Buy + borrow", which the website had no word for.
- The dashboard's category filter put a stand mixer and a cast-iron
  skillet under **Electronics** — "Kitchen & Appliances" matched the
  keyword "appliance" first. Loop's categories are a closed list of
  twelve, so it's a lookup now, not a guess.

---

## Where it came from

I ran a six-dimension audit of both codebases (write paths, read
predicates, visibility, vocabulary, money, feature gaps) with every
finding adversarially verified: 86 agents, 67 confirmed, 12 refuted — and
ten of those twelve were refuted because I'd already fixed them while it
ran. I checked the load-bearing ones myself against the live databases
before changing anything, which is how both the two-projects finding and
the eight exposed items turned up.

I broke /community for about twenty minutes doing it — I added three
columns to the website's types from the app's types, assuming one
database, and an unknown column makes PostgREST reject the whole query.
Caught by looking at the deployed page rather than trusting the build;
`npm run build` doesn't typecheck, and in this repo neither does
`tsc --noEmit` (the root tsconfig has `"files": []`). The real command is
`npx tsc -p tsconfig.app.json --noEmit`.

## What I didn't touch, and why

- **`is_donated` means opposite things** on the two surfaces — a live
  offer in the app, "it's gone" on the website. The obvious fix breaks
  things: re-exposing it as an offer makes items vanish from the owner's
  own dashboard, because six website readers still treat it as gone, and
  one of them is a deliberately byte-identical shared file that would
  have to change in both repos together. **This needs your decision on
  which meaning wins.**
- **The website takes no money.** "Buy" sends a chat message; there's no
  checkout, no escrow, no payouts anywhere on the web. That's a feature,
  not a bug fix.
- **A "$9.99/month Pro" plan** the website sells and the app has never
  heard of, and the /founders $49/$99/$249 tiers with perks nothing
  implements. Commercial decisions.
- **The swap marketplace** exists only on the website; the app doesn't
  know it's there.
- **Smart/bulk photo paths store raw base64 in the database** instead of
  a URL. Real, bigger than a day.

## Branches

```
app       Loop.git             map-panel-grid      pushed
website   ecoinventory2026.git website-match-app-brand  pushed
```

Nothing merged to main, nothing submitted, no production database
touched. The two SQL files are yours to run.
