# Loop — where things stand, and what's next

28 Oct 2026. Everything here was checked against your live database and your
actual code. Where something I told you earlier turned out to be wrong, it
says so.

**The website:** https://loop-web-preview.pages.dev

---

## Part 1 — done today, nothing needed from you

### The website

**It now says what Loop is.** The old page opened with "You already own four
umbrellas" and twelve invented colour tiles. Clever, well made, and it failed
the five-second test — the words *neighbor*, *borrow* and *lend* didn't appear
above the fold at all. A stranger on a phone could tell you Loop was an iPhone
app in FiDi that had something to do with owning too many water bottles. They
could not tell you it involved other people, which is the whole product.

It now opens with **"Borrow it from a neighbor."** and one line explaining it,
then real photographs, then how it goes. The page went from about eight phone
screens to four.

**It has real pictures.** You said AI pictures beat no pictures. You were right
that bare was wrong — but the answer was neither. Your own database had the
best photographs available: real things, in real FiDi apartments, taken on
phones by the people who own them. Six now sit on the landing page, pulled
live, so they update themselves and can never be a lie about what's on Loop.
(Two bugs caught first: one tile was a broken image, another said "Untitled
item".)

**Cut:** the hours calculator, the repeats carousel and the "fifth one" bars —
three sections making the same joke three times. The files are still on disk,
just unused, if you want any of it back.

### The legal pages — this was the thing blocking your domain switch

Your **current** celebrateloop.com/privacy discloses that photos go to
Anthropic. The new page disclosed nothing of the kind, so switching the domain
would have quietly **deleted** disclosures from the exact URL Apple has on
file. I'm glad I waited.

Checking properly turned up something worse: **twelve** companies receive your
users' data, and the two worst omissions weren't Anthropic.

- **OpenAI** receives users' **raw voice recordings** when they talk to the
  assistant instead of typing. Named nowhere.
- **Uber** receives **both neighbours' full street addresses and phone
  numbers** in one payload for courier delivery. Named nowhere.

The privacy page now names all twelve, in two tables, with exactly what each
one gets and what you can do to avoid it. It's a strict superset of what you
published before — nothing was dropped.

**The Terms said something false about money.** Section 5 read *"funds are held
by our payment processor."* They aren't. Stripe charges the card and the money
lands in **Loop's own balance**, where it stays until both sides confirm. Loop
takes custody. It now says so plainly, with a table showing the fee at every
price point — including that the $1 minimum makes your share 50% on a $2
rental, not 10%.

**Two raw placeholders were live on your Terms page** where App Review would
have seen them: `[AMOUNT]` and `[STATE / JURISDICTION]`. I filled both with the
standard answers so nothing reads as unfinished — see Part 3, they want your
lawyer's eye.

### The app

- **Push notifications saved.** `send-push` had a syntax error committed to the
  repo (`Deno.const` — a find-and-replace accident). Push works today only
  because the deployed copy is older; the next deploy of that function would
  have killed every notification. I checked all 41 edge functions; it was the
  only one.
- **The empty-Discover trap, fixed.** A reviewer in California who taps "Allow"
  on location sees **zero items**, and the distance picker stopped at 10 miles,
  so there was no way out. "App appears empty" is Apple's most-used rejection
  reason for marketplace apps. There's now an **"Any distance"** option, and the
  "Widen distance" button appears at 10 miles too — previously the one person
  most stuck was the only one not shown the way out.
- **Fee wording.** The seller and buyer screens now say "10%, or $1 — whichever
  is larger" rather than just the percentage.

### Safety

Four `.sql` files in your app repo now carry an unmissable **⛔ DO NOT PASTE**
banner. You have 41 loose SQL files with nothing marking the safe ones, and
four would do real damage — one drops your live follow graph, one repoints
friendship at the wrong table.

---

## Part 2 — your list, in order

### 1. Run the profiles lockdown — 2 minutes

**This is the most important thing on this page.**

Anyone on the internet can currently read your `profiles` table using the key
that ships inside your app: **12 email addresses, 10 real names, 7 home GPS
coordinates, 7 push tokens, 3 birth years.** That's every user you have. It also
contradicts the privacy policy published today.

1. Open `https://supabase.com/dashboard/project/taodxvqcgszqkqhtwkqt/sql/new?skip=true`
2. Check the address bar says `taodxvqcgszqkqhtwkqt` — you have two projects
3. Paste all of **[STEP-4-lock-down-profiles.sql](STEP-4-lock-down-profiles.sql)**
4. Press **⌘ + Return**. Expect `Success. No rows returned`
5. Tell me — I'll re-measure from outside and confirm

**It cannot break the app on people's phones.** It restricts signed-*out*
callers only. I verified this against the *built* website bundle, not the
source — which mattered, because the one component that read neighbours'
coordinates turned out to be dead code that never ships. Every column being
revoked is used only on signed-in screens.

### 2. Fix password reset — 2 minutes

Supabase → **Authentication** → **URL Configuration**. Site URL is still
`http://localhost:3000`, so a password-reset email opens a dead page on the
user's own computer.

- **Site URL** → `https://celebrateloop.com`
- **Redirect URLs** → add `https://celebrateloop.com/**` and
  `https://loop-web-preview.pages.dev/**`

Highest value per minute on this page.

### 3. Fix Google sign-in — 3 minutes

`https://console.cloud.google.com/auth/clients` → the client whose Type is
**Web application** (an iOS client has no redirect field — that's where people
get stuck) → **Authorized redirect URIs** → **Add URI**:

```
https://taodxvqcgszqkqhtwkqt.supabase.co/auth/v1/callback
```

→ **Save**. Takes 5 minutes to a few hours to apply.

### 4. Check which Stripe mode you're in — 10 minutes

**The thing I'd want certainty on before anything ships.**

Your app ships a **live** Stripe key, the Buy and Rent buttons are wired to it,
and there's no off switch — while your own `STRIPE_GO_LIVE.md` says you're in
test mode. Buyers' money lands in Loop's own balance and sits there until both
sides confirm.

In Stripe: turn **Test mode** off, look at **Developers → API keys**, and tell
me what you find.

### 5. Create the reviewer's demo account — 15 minutes

A reviewer can't see a pixel of Loop without logging in. No account = rejected
within the hour.

1. Phone → **Settings → Sign out**
2. Sign up as `review@celebrateloop.com`, simple password, **no special
   characters** (reviewers type these by hand)
3. Complete onboarding — **don't skip the profile step**
4. **The important bit:** Discover → tap the distance chip → set your location
   to **Financial District, New York**. Loop trusts the saved profile location
   over the phone's GPS, and Apple's reviewers are in California
5. Add **two listings with photos** from this account
6. Write the login down

### 6. Say the word on the domain

Then celebrateloop.com becomes the real site. One command, one-click rollback.

This now matters more than it did this morning: **`celebrateloop.com/support`
currently serves your waitlist homepage.** Apple requires a working Support URL
and checks it. A reviewer clicking it finds a mailing-list signup.

*(I had earlier told you all four static pages were genuine. That was wrong for
`/support` — my check compared page hashes, and Cloudflare randomises an
email-obfuscation token on every response, so two identical pages looked
different. `/privacy` and `/terms` are genuine; `/support` is not.)*

---

## Part 3 — decisions only you can make

**Your liability cap.** I filled it with the standard marketplace answer — the
greater of $100 or the fees you paid Loop in the previous six months — because a
raw `[AMOUNT]` on a live legal page is worse. It's a legal number; have it
checked. `src/pages/Terms.tsx`, section 8.

**Governing law.** I put **New York** — you're a New York LLC launching in FiDi,
so that's a factual match, not a legal judgment — and a plain venue clause. An
arbitration clause genuinely needs a lawyer, so I didn't invent one. Section 12.

**Holding other people's money.** Loop takes custody of buyers' funds and pays
sellers later. That's the highest-responsibility Stripe Connect pattern and it's
a real regulatory surface for a solo founder. Worth an hour of a lawyer's time
before you have real users.

**Does courier delivery ship in 1.0?** It's built and live, and it's the single
largest personal-data transfer in Loop — both neighbours' full addresses and
phone numbers to Uber. If it isn't ready, turning it off before you submit
removes a whole processor from the policy and one less thing Apple can ask
about.

---

## Part 4 — the App Store

Your listing already exists: Apple ID `6772380914`. You are not starting from
zero. The hard requirements Apple rejects people over — **account deletion,
report, block, Sign in with Apple, no broken in-app purchase** — are all
genuinely built; each was verified in the source, not in a checklist.

**Premium is correctly switched off** for 1.0.0, which removes a whole category
of rejection. You don't need RevenueCat, subscription products or the Paid Apps
agreement to ship. That's a 1.1 problem.

What's actually missing is unglamorous:

| | who | time |
|---|---|---|
| **Screenshots — there are zero.** 6.9-inch iPhone, 1320×2868, six of them. No iPad needed (Loop is iPhone-only). | me, then you paste | 90 min |
| **A real /support page** — needs the domain switch | me | 15 min |
| **Demo account** — step 5 above | you | 15 min |
| **Listing copy** — pre-written in `docs/app-store-listing.md`; replace `[SUPPORT EMAIL]` with hello@celebrateloop.com | you | 20 min |
| **Age rating questionnaire** — UGC yes, chat yes, moderation yes, unrestricted web **no** (answering yes forces 17+). Lands at 13+ | you | 10 min |
| **App Privacy labels** — must match the new policy. Everything "Linked to identity: yes", everything "Used to track you: **no**" (no ad SDK, so no tracking popup). Coarse location, not Precise | you | 25 min |
| **App Review notes** — including "please tap Don't Allow on location". That one sentence is the highest-value line in your submission | you | 10 min |
| **Build 71** — build 70 is 18 commits old and predates the LLC Stripe switch | me | 45 min |

**Category:** Shopping primary, Lifestyle secondary. **Content Rights:** yes,
third-party content (listings and photos are your users' — saying no is a
rejection). **Copyright:** `2026 Loop Max Your Stuff LLC`.

---

## The honest part

There are **nine browsable items from four people** in the whole app, and only
five within reach of FiDi. Loop will pass review before it's ready to impress
anyone. Seeding real FiDi inventory matters more to your launch than anything on
Apple's checklist — and it's also what makes the website's photo band look
alive, since it reads from the same place.

---

## Two corrections

Earlier today I relayed two findings that didn't hold up when I checked them
myself. Both were wrong:

1. **"The payouts screen hides the $1 minimum."** It didn't — the line directly
   underneath already said it. I tightened the wording anyway.
2. **"A courier migration was never applied."** It was. The column exists.

I'm flagging these because I'd rather you know which of my claims I verified
and which I passed along.
