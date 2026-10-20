# Why login didn't work, and the one command that finishes the fix

## Two separate bugs. I fixed the first; the second needs you.

### Bug 1 — the Google button went to a 404 (FIXED, deployed)

`src/pages/Auth.tsx` called a Lovable wrapper that navigates the browser
to `/~oauth/initiate?provider=google&...`. **That path exists only on
Lovable's own hosting.** Anywhere else — Cloudflare Pages,
celebrateloop.com, localhost — it hits the SPA fallback and the app
renders its own 404. I watched it happen in a browser; the console said:

```
404 Error: User attempted to access non-existent route: /~oauth/initiate
```

Nothing throws, nothing logs to a server, you just land on a 404 page.
That is why this never got caught.

It now uses Supabase's own `signInWithOAuth`. No Lovable service in the
path. Deployed.

### Bug 2 — the website's database has no Google credentials (NEEDS YOU)

Fixing the button revealed the real problem. Asking each project's auth
endpoint directly:

```
WEBSITE  google -> 400 {"msg":"Unsupported provider: missing OAuth secret"}
WEBSITE  apple  -> 400 {"msg":"Unsupported provider: provider is not enabled"}
APP      google -> 302 redirect to accounts.google.com      <-- works
APP      apple  -> 400 {"msg":"Unsupported provider: missing OAuth secret"}
```

Google is *listed* as enabled on the website's project but has **no
client secret**. Lovable was brokering Google through its own service, so
the project never needed real Google credentials — and the moment you host
anywhere but Lovable, there is no working way in at all:

- Google can't start (no secret)
- and anyone who signed up with Google has no password to fall back on

**On the app's project Google works right now, with nothing to
configure.** That is also where your phone's items and your real account
live. So this isn't a preference any more — it is the only project where
the website can log anyone in.

## The command

```bash
cd /Users/akexandravargas/Claude/ecoinventory2026-brand-preview && cp .env .env.website-project.backup && sed -i '' -e 's#^VITE_SUPABASE_PROJECT_ID=.*#VITE_SUPABASE_PROJECT_ID="taodxvqcgszqkqhtwkqt"#' -e 's#^VITE_SUPABASE_URL=.*#VITE_SUPABASE_URL="https://taodxvqcgszqkqhtwkqt.supabase.co"#' .env && grep -n VITE_SUPABASE .env
```

That swaps the project id and URL and keeps a backup. It prints the result
so you can see it worked. **It does not change the key** — you need to
paste that one yourself, because it is the one value I shouldn't handle:

1. Open `ecoinventory-mobile/.env` and copy the value of
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Paste it as `VITE_SUPABASE_PUBLISHABLE_KEY` in
   `ecoinventory2026-brand-preview/.env`.

(It is a publishable key — it already ships inside your iOS app — so this
is not a secret leak. It is just not mine to copy around.)

Then tell me and I will rebuild, redeploy, turn on the rent fields (the
app's project has those columns), and check every page against the new
database.

## One thing that may still bite, and the fix if it does

After you sign in with Google you might land on a *different* domain than
the one you started on — celebrateloop.com, or the old Lovable URL —
still signed in, just the wrong site.

That happens when the URL you came from isn't on the project's redirect
allow-list: Supabase doesn't error, it silently falls back to the
project's Site URL. I can't read the allow-list from outside (I tested —
Supabase accepts any `redirect_to` at the start and only validates it at
the end).

If it happens: Supabase dashboard → project `taodxvqcgszqkqhtwkqt` → **Authentication → URL Configuration → Redirect URLs** → add

```
https://loop-web-preview.pages.dev/**
https://celebrateloop.com/**
http://localhost:5173/**
```

One line each, save, try again.

## Also fixed on the login page

- **The Apple button only appears when the project can actually serve
  it.** It used to render unconditionally while the website's project had
  no Apple provider at all — a button that could only fail. It asks
  `/auth/v1/settings` which providers are real and shows only those. (On
  the website's project that means Apple is now hidden; on the app's
  project Apple has no web secret either, because the iPhone signs in
  with Apple natively through a different credential.)
- **"Invalid login credentials" now says something useful.** Supabase
  returns that same string whether the password is wrong *or* the account
  has no password at all — which is every Google account. It used to send
  you round the password-reset loop for an account that never had a
  password. It now says: if you signed up with Google, use the Google
  button.
