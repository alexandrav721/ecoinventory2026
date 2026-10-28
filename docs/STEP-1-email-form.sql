-- ============================================================================
-- STEP 1 — MAKE THE EMAIL SIGNUP WORK
--
-- Safe. Creates one new table. Touches nothing that already exists.
-- Safe to run twice (every statement says "if not exists" / "drop if exists").
--
-- Paste the whole thing, press Run, expect a green "Success".
-- ============================================================================

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anyone may join. Nobody may read the list back: there is an INSERT policy
-- and deliberately NO SELECT policy, and under row-level security anything
-- without a policy is denied. You read your own list in the Table Editor,
-- which connects as the service role and ignores RLS.
drop policy if exists "anyone can join the waitlist" on public.waitlist;
create policy "anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (
    email is not null
    and char_length(email) between 5 and 320
    and position('@' in email) > 1
  );

-- One row per address, case-insensitively. A repeat signup returns 409, which
-- the website treats as success — telling someone she is a duplicate is both
-- unfriendly and a disclosure that her address is stored.
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

-- Tell the API layer about the new table immediately. Without this there is a
-- short window where the signup form still fails with the same error, which
-- would make it look like this script did not work.
notify pgrst, 'reload schema';

-- One statement, so you actually see its result. Expect: 0
select count(*) as waitlist_rows_should_be_zero from public.waitlist;
