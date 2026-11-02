-- ============================================================================
-- STEP 8 — THE MAP, WITHOUT HANDING OUT ANYONE'S ADDRESS
--
-- Run once. Safe to run twice. Adds one function; changes nothing existing.
--
-- THE PROBLEM THIS SOLVES. A map needs coordinates, and STEP-4 deliberately
-- revoked latitude and longitude from anonymous visitors so a stranger
-- cannot harvest your members' home locations. Both of those are correct and
-- they contradict each other. This is the way out: a function that can read
-- the coordinates but can only ever RETURN a grid cell.
--
-- HOW IT WORKS, and why the number 0.0075. That is the same cell size your
-- iPhone app already uses — src/components/ExploreMap.tsx, ZONE_STEP_DEG —
-- about 0.52 miles on a side. Every coordinate is rounded to the centre of
-- its cell, and everything in the same cell collapses into one bubble with a
-- count. There is no averaging and nothing to un-round: two neighbours in
-- the same cell produce exactly the same output as one, so the map cannot be
-- used to work out where anybody lives. The website will now show the same
-- resolution the app does, which is also exactly what your privacy policy
-- already promises.
--
-- SECURITY DEFINER is the point. It lets this one function read the
-- coordinate columns that the anonymous role cannot, and return only the
-- rounded result. Nothing else gains access. `set search_path` is pinned so
-- the function cannot be tricked into resolving a different `public`.
--
-- WHAT IT COUNTS: only things a stranger can already see on the website —
-- public, available, not sold, not eliminated, genuinely offered, and
-- photographed. The same rule as the shop window, so the map can never
-- promise a bubble you cannot click through to.
-- ============================================================================

create or replace function public.public_map_zones()
returns table (lat numeric, lng numeric, items integer, people integer)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with visible as (
    select
      i.user_id,
      round((p.latitude  / 0.0075)::numeric, 0) * 0.0075 as cell_lat,
      round((p.longitude / 0.0075)::numeric, 0) * 0.0075 as cell_lng
    from public.inventory_items i
    join public.profiles p on p.id = i.user_id
    where i.sharing_level = 'public'
      and i.is_available_for_sharing = true
      and coalesce(i.is_sold, false) = false
      and coalesce(i.is_eliminated, false) = false
      and coalesce(i.admin_hidden, false) = false
      -- genuinely offered to somebody: the shop window's own rule
      and (
        coalesce(i.rent_price, 0) > 0
        or coalesce(i.sharing_price, 0) > 0
        or i.is_for_borrow = true
      )
      -- and photographed, because an unphotographed thing is not visible
      and i.image_urls is not null
      and array_length(i.image_urls, 1) > 0
      and p.latitude is not null
      and p.longitude is not null
  )
  select
    cell_lat,
    cell_lng,
    count(*)::integer              as items,
    count(distinct user_id)::integer as people
  from visible
  group by cell_lat, cell_lng
  order by items desc;
$$;

-- Anyone may ask. The function is the boundary, not the grant.
grant execute on function public.public_map_zones() to anon, authenticated;

notify pgrst, 'reload schema';

-- Check it: one row per populated half-mile cell. Coordinates will be round
-- multiples of 0.0075 — if you see anything with more decimal places than
-- that, stop and tell me, because it would mean a real location is leaking.
select * from public.public_map_zones();
