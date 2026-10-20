# The brand/Home/Insights preview

This folder is a **git worktree** of `ecoinventory2026` on branch
`website-match-app-brand`. Your normal `ecoinventory2026` folder is
untouched and still on `add-legal-pages`.

## Run it

```bash
cd /Users/akexandravargas/Claude/ecoinventory2026-brand-preview
npm run dev
```

Then open http://localhost:5173 (or whatever port it prints).

`node_modules` here is a **symlink** to the one in your main
`ecoinventory2026` folder, so there is nothing to install. If you ever
delete or reinstall node_modules over there, run `npm install` here once
and it becomes a real folder.

## What to look at

| URL | What changed |
| --- | --- |
| `/` | Landing — repainted to the app's claret + Instrument Serif |
| `/home` | New. The summary page, mirroring the app's Home tab |
| `/insights` | New. Everything you own, every figure with its denominator |
| `/dashboard` | Existing workspace — now reads real data, not mock numbers |

## The test that needs you

I could not sign in, so nothing behind `/auth` was verified against a real
account. Two minutes settles it:

1. Sign in. Does `/home` show your real ring?
2. Add an item here → does it appear on the phone's Home?
3. Add one on the phone → does it appear here?
4. Sign out, sign in as the second account → do you see only that
   account's things?

**If step 4 fails, stop and say so.** That would be a row-level security
problem rather than a UI one, and it is the only failure here that matters.

## Throwing it away

```bash
cd /Users/akexandravargas/Claude/ecoinventory2026
git worktree remove ../ecoinventory2026-brand-preview
```

The branch stays on GitHub either way.
