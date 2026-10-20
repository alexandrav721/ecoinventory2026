# Why login didn't work, and how to finish it

## Three bugs stacked on each other

**1. The Google button went to a 404.** FIXED, deployed.

`Auth.tsx` called a Lovable wrapper that navigates to
`/~oauth/initiate?provider=google&...` — a path that exists **only on
Lovable's own hosting**. Anywhere else it hits the SPA fallback and the app
renders its own 404. I watched it in a browser:

```
404 Error: User attempted to access non-existent route: /~oauth/initiate
```

Nothing throws, nothing reaches a log. That's why it was never caught. It
now uses Supabase's own `signInWithOAuth`.

**2. The website's database has no Google credentials.** Asking each
project's auth endpoint directly:

```
WEBSITE  google -> 400 "Unsupported provider: missing OAuth secret"
WEBSITE  apple  -> 400 "Unsupported provider: provider is not enabled"
APP      google -> 302 redirect to accounts.google.com      <-- works
APP      apple  -> 400 "Unsupported provider: missing OAuth secret"
```

Google is *listed* as enabled on the website's project but has no client
secret — Lovable brokered Google through its own service, so that project
never needed real credentials. So on the website's project there is no way
in at all: Google can't start, and a Google account has no password to
fall back on.

**3. Neither project allows the website's address back in.** This is the
one I got wrong in the first version of this file, and it's the one that
actually blocks you.

Supabase only returns you to an address on its allow-list; anything else
is silently replaced by the project's Site URL. You can read that from
outside with a deliberately invalid recovery token, which consumes nothing:

```
APP project
  https://celebrateloop.com/            -> http://localhost:3000   NOT allowed
  https://loop-web-preview.pages.dev/   -> http://localhost:3000   NOT allowed
  http://localhost:5173/                -> http://localhost:5173/  ALLOWED

WEBSITE project
  everything                            -> https://ecoinventory2026.lovable.app
```

So the app's project thinks it is still a localhost:3000 project, and the
website's project still thinks it is the Lovable preview. **Repointing
alone does not fix login** — Google would complete and then drop you on a
dead localhost page. That is also why "Forgot password?" is broken today:
the email link lands on the old Lovable domain.

---

## Finish it in two steps

### Step 1 — prove it works, locally, in two minutes

`http://localhost:5173` is **already allow-listed** on the app's project.
So this works today with no dashboard changes:

```bash
cd /Users/akexandravargas/Claude/ecoinventory2026-brand-preview && cp .env .env.website-project.backup && sed -i '' -e 's#^VITE_SUPABASE_PROJECT_ID=.*#VITE_SUPABASE_PROJECT_ID="taodxvqcgszqkqhtwkqt"#' -e 's#^VITE_SUPABASE_URL=.*#VITE_SUPABASE_URL="https://taodxvqcgszqkqhtwkqt.supabase.co"#' .env && grep -n VITE_SUPABASE .env
```

Then paste the key: open `ecoinventory-mobile/.env`, copy
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, and put it in this repo's `.env` as
`VITE_SUPABASE_PUBLISHABLE_KEY`. (It's a publishable key — it already
ships inside your iOS app — it just isn't mine to copy around. Both `.env`
edits were blocked for me, which is why this is a command and not done.)

```bash
cd /Users/akexandravargas/Claude/ecoinventory2026-brand-preview && npm run dev
```

Open `http://localhost:5173`, click **Sign in with Google**. You should
land back signed in, looking at *your* things — the ones on your phone.

If that works, the whole chain is proven and step 2 is just addresses.

### Step 2 — make the deployed site work (one dashboard field)

Supabase → project `taodxvqcgszqkqhtwkqt` → **Authentication → URL
Configuration**:

- **Site URL**: change `http://localhost:3000` to `https://celebrateloop.com`
- **Redirect URLs**: add

```
https://celebrateloop.com/**
https://loop-web-preview.pages.dev/**
http://localhost:5173/**
```

Then tell me and I'll rebuild and redeploy.

---

## What moving costs you

I had five agents probe every table, column, function and bucket the live
website touches against the app's project. Nothing crashes, but these stop
working:

| What dies | Why |
|---|---|
| AI "smart add" (photo + text) | `analyze-item` isn't deployed on the app's project |
| Receipt scanning | `process-receipt` likewise |
| Before You Buy | `before-you-buy` likewise |
| "Find similar items" | `find-similar-items` likewise |
| AI category suggestion | `suggest-category` likewise |
| The inventory assistant | exists on both, but the request shapes don't match |
| Category parent/child UI | `categories.parent_id` and `user_id` don't exist there |

All of those edge functions exist in **this** repo's `supabase/functions/`.
They aren't lost — they just need deploying to the app's project, which is
a `supabase functions deploy` each plus their API keys. Worth doing as a
follow-up, not a blocker.

Also: photos uploaded on the web go to a bucket called `inventory-images`
while the app's photos live in `inventory-photos`. Both display fine (the
full URL is stored), but they should be one bucket eventually.

And the 10 accounts that exist only in the website's project stop working
— they hold its 32 seeded items. Yours is one of them, which is why you
have a login there at all; after the move you'd use your **app** account,
which is the one with your real things.

---

## Also fixed on the login page

- **The Apple button only shows when the project can serve it.** It used
  to render always, while the website's project had no Apple provider at
  all — a button that could only fail. It asks `/auth/v1/settings` which
  providers are real. (After the move Apple *is* enabled on the app's
  project, though it has no web secret either, because the iPhone signs in
  with Apple natively through a different credential.)
- **"Invalid login credentials" now says something useful.** Supabase
  returns that string whether the password is wrong *or* the account has
  no password at all — which is every Google account. It used to send you
  round the password-reset loop for an account that never had a password.

## One thing to know about new signups after the move

The app's project does **not** auto-confirm email addresses (the website's
does). So someone signing up with email on the website will get no session
until they click a confirmation email — and until step 2 is done, that
link also goes to localhost:3000. Step 2 fixes both. Google signups are
unaffected.
