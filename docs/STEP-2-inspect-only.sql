-- ============================================================================
-- STEP 2 — READ-ONLY. LOOK, DON'T TOUCH.
--
-- Changes NOTHING. It asks the database to describe its own current rules.
--
-- WHY: the security fix removes an existing rule BY NAME. The name I had came
-- from a different Supabase project (Lovable's). If it is spelled differently
-- here, the removal silently does nothing, the screen still says "Success",
-- and all 8 friends-only items stay readable by anyone — while reporting that
-- the leak is closed. Two independent reviews both called this the single
-- biggest risk, so we look before we touch.
--
-- The repo's .sql files are provably NOT a complete record of this database
-- (one of them references a policy that no migration ever creates), so the
-- live listing below is the only trustworthy source.
--
-- It is deliberately ONE query: the Supabase SQL editor displays only the
-- LAST statement's results, so a script with several SELECTs would hide most
-- of what we need.
--
-- Paste, Run, send me the whole result table.
-- ============================================================================

select
  'policy' as kind,
  policyname as name,
  cmd::text  as applies_to,
  coalesce(qual, '(none)') as the_rule
from pg_policies
where schemaname = 'public' and tablename = 'inventory_items'

union all

-- Step 3 will call are_friends() instead of looking up the friendships table
-- inline. Confirm it exists and bypasses row-level security (SECURITY
-- DEFINER), because that is what makes it safe to rely on.
select
  'function',
  p.proname,
  case when p.prosecdef then 'SECURITY DEFINER (good)' else 'security invoker' end,
  pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'are_friends'

order by kind desc, name;
