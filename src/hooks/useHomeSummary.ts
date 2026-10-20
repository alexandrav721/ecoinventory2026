/**
 * useHomeSummary (web) — the data behind /home.
 *
 * The mobile app has a hook of the same name over the same model. The two
 * differ only in how they fetch: the app reuses useMyInventory, which is
 * already warm from Discover; the website has no such cache, so it queries
 * directly. The COUNTING is identical because both call buildHomeSummary
 * from src/lib/homeSummary.ts, which is a byte-for-byte copy of the app's.
 *
 * ── THE NULL TRAP, which this codebase has already fallen into once ──────
 *
 * is_sold / is_donated / is_eliminated are nullable booleans. PostgREST's
 * `eq.false` does NOT match NULL, so `.eq("is_sold", false)` silently drops
 * every row where nobody ever set the flag — which is most older rows.
 * WelcomeHeader.tsx did exactly that and under-counted people's things.
 *
 * So this query filters with `.not(col, "is", true)`, which keeps NULL. It
 * also fetches is_sold / is_donated rather than excluding them server-side,
 * because buildHomeSummary needs them to compute "moved on".
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { buildHomeSummary, type HomeSummary } from "@/lib/homeSummary";

/**
 * The signed-in user, kept live.
 *
 * getSession() alone is not enough: it answers once, so a tab left open
 * through a sign-out keeps rendering the previous account's things until
 * reload. The subscription is what makes the page honest about who it is
 * showing — and unsubscribing is what stops it leaking across accounts.
 * Same pattern as src/pages/Dashboard.tsx.
 */
export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setChecking(false);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, checking };
}

export type NeighborAsk = {
  id: string;
  itemName: string;
  description: string | null;
  requesterName: string;
};

export function useHomeSummary(userId: string | undefined) {
  const items = useQuery({
    queryKey: ["home-inventory", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(
          "id, name, image_urls, is_for_sale, is_for_borrow, is_sold, is_donated, created_at"
        )
        .eq("user_id", userId!)
        .not("is_eliminated", "is", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = useQuery({
    queryKey: ["home-profile", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, public_display_name")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const asks = useQuery({
    queryKey: ["home-asks", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<NeighborAsk[]> => {
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      /* THIS SHELF HAS ALWAYS BEEN EMPTY, on both Supabase projects.
         It asked for an embedded join —
           requester:profiles!item_requests_requester_id_fkey(...)
         — and no such foreign key exists. PostgREST answers 400:
           Could not find a relationship between 'item_requests' and
           'profiles' in the schema cache
         `if (error) throw error` put react-query into an error state, Home
         guards on `asks.length > 0`, and the section rendered its "nobody
         has asked for anything yet" copy instead. A feature that is
         missing looks exactly like a feature nobody is using, which is
         why this never got reported. Checked against BOTH projects: the
         FK is absent from each, and selecting `id, requester_id` alone
         works, so only the embed was wrong.

         Two queries rather than a join. Names are a separate lookup by
         id, and an ask whose requester we cannot name still shows — the
         ask is the point, not the asker. */
      const { data, error } = await (supabase as any)
        .from("item_requests")
        .select("id, item_name, description, is_anonymous, requester_id, status, created_at")
        .eq("status", "open")
        .neq("requester_id", userId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;

      const rows = (data ?? []) as any[];
      /* Only the ones that are not anonymous — no reason to look up a name
         we have already decided not to show. */
      const nameIds = Array.from(
        new Set(
          rows
            .filter((w) => !w.is_anonymous && w.requester_id)
            .map((w) => w.requester_id as string)
        )
      );
      const names = new Map<string, string>();
      if (nameIds.length > 0) {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, public_display_name, full_name")
          .in("id", nameIds);
        for (const person of (people ?? []) as any[]) {
          const n = person.public_display_name ?? person.full_name;
          if (typeof n === "string" && n.trim()) names.set(person.id, n.trim());
        }
      }

      return rows.map((w) => ({
        id: w.id,
        itemName: (w.item_name ?? "").toString(),
        description: w.description ?? null,
        requesterName: w.is_anonymous
          ? "A neighbour"
          : (names.get(w.requester_id) ?? "A neighbour"),
      }));
    },
  });

  const rows = (items.data ?? []) as any[];
  const summary: HomeSummary = buildHomeSummary(rows as any);

  const full =
    (profile.data as any)?.full_name ??
    (profile.data as any)?.public_display_name ??
    null;
  const firstName =
    typeof full === "string" && full.trim() ? full.trim().split(/\s+/)[0] : null;

  return {
    summary,
    firstName,
    items: rows,
    asks: asks.data ?? [],
    isLoading: items.isLoading,
    isError: items.isError,
    refetch: items.refetch,
  };
}
