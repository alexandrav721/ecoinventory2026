-- ============================================================================
-- STEP 7 — THE PAYMENTS KILL SWITCH
--
-- Run once. Safe to run twice. This only ADDS a table; it changes nothing
-- that already exists.
--
-- WHAT IT GIVES YOU. After this (and the app build that reads it), turning
-- payments off is: open Supabase → Table Editor → platform_flags → change
-- `enabled` from true to false. Every copy of Loop stops taking payments
-- within seconds. No new build, no Apple review. Flip it back when you're
-- ready. Without it, your only way to stop payments is to ship a new version
-- and wait out App Review — roughly a week, with money moving the whole time.
--
-- WHY A NEW TABLE AND NOT `app_config`. There is already an `app_config`
-- table, and it holds your SERVICE ROLE KEY for push notifications. It is
-- deliberately invisible to clients — `revoke all ... from anon,
-- authenticated`. A kill switch has to be readable BY the app, so putting it
-- in that table would have meant granting clients read access to the table
-- holding a key that can do anything to your database. Different
-- sensitivity, different table.
--
-- WHO CAN FLIP IT. Only you, through the dashboard. The table has a SELECT
-- policy and deliberately NO insert/update/delete policy, so under row-level
-- security no app user can change a flag — a kill switch a user can flip is
-- not a kill switch. The dashboard connects as the service role and ignores
-- RLS, which is exactly the asymmetry we want.
--
-- WHY THE FLAG IS PUBLIC TO READ. Knowing that payments are paused tells an
-- attacker nothing they would not learn by tapping Buy. Secrecy would buy
-- nothing and would stop the app reading it.
-- ============================================================================

create table if not exists public.platform_flags (
  key         text primary key,
  enabled     boolean not null default true,
  note        text,
  updated_at  timestamptz not null default now()
);

alter table public.platform_flags enable row level security;

grant select on public.platform_flags to anon, authenticated;

drop policy if exists "flags are readable" on public.platform_flags;
create policy "flags are readable"
  on public.platform_flags
  for select
  to anon, authenticated
  using (true);

-- Deliberately no INSERT / UPDATE / DELETE policy. Under RLS, anything
-- without a policy is denied, so only the service role can change a flag.

insert into public.platform_flags (key, enabled, note)
values (
  'payments_enabled',
  true,
  'Master switch for taking NEW payments. Set false to stop checkout '
  'everywhere within seconds, without shipping a build. Refunds and paying '
  'out money already held are deliberately NOT affected — turning this off '
  'must never trap funds that are already in escrow.'
)
on conflict (key) do nothing;

notify pgrst, 'reload schema';

-- One statement, so you actually see it. Expect one row, enabled = true.
select key, enabled, note from public.platform_flags;


-- ─── HOW TO USE IT, when you need it ────────────────────────────────────────
--   Supabase → Table Editor → platform_flags → the payments_enabled row →
--   click `enabled`, change true to false, press Enter. That is the whole
--   thing. Buyers then see "Payments are temporarily paused" instead of a
--   checkout sheet.
--
--   Or from this SQL editor:
--     update public.platform_flags set enabled = false, updated_at = now()
--      where key = 'payments_enabled';
--
-- ─── WHAT IT DOES NOT STOP, on purpose ──────────────────────────────────────
--   Refunds, releasing money to sellers after a handoff, and disputes all
--   keep working. If turning off payments also froze payouts, flipping the
--   switch during a problem would strand every buyer's money mid-escrow —
--   which is a worse failure than the one you were trying to stop.
