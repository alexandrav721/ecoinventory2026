/**
 * The two sets isItemVisible needs: who you are friends with, and who you
 * have blocked.
 *
 * Both are ports of the app's hooks (useFriendships.useFriendIds and
 * useMutes.useMutedIds) with the same table, the same predicate and the
 * same 60s staleTime, so the two surfaces answer "is this person my
 * friend?" from the same rows at the same freshness. The app's comment on
 * that 60 seconds is worth keeping: an inbound accept from the OTHER side
 * runs no mutation here, so a long stale window left someone looking like
 * a stranger minutes after they accepted.
 *
 * BOTH SETS ARE SECURITY-RELEVANT AND NEITHER HAS A DATABASE BACKSTOP.
 * `mutes` is enforced only on the client, and the one cross-user SELECT
 * policy on inventory_items checks `is_available_for_sharing` and nothing
 * else. So a surface that forgets these sets does not degrade gracefully —
 * it leaks. useVisibilityContext() bundles them precisely so a caller
 * cannot remember one and forget the other.
 *
 * HOW FAILURE DEGRADES, AND WHY IT IS NOT SYMMETRIC.
 *
 * I first wrote this fail-closed on both queries: any error meant
 * `ready: false` and callers rendered nothing. That was wrong, and it was
 * wrong in a way that took the whole site down rather than one feature —
 * `mutes` DOES NOT EXIST on the website's Supabase project
 * ("Could not find the table 'public.mutes' in the schema cache"), so
 * every signed-in visitor would have seen an empty browse grid, an empty
 * people directory and empty profiles. Signed-OUT visitors were fine,
 * which is exactly why testing only the logged-out pages missed it.
 *
 * The two sets fail in opposite directions, so they get opposite
 * treatment:
 *
 *   friendSet unknown  -> treat as EMPTY. That HIDES friends-only items,
 *                         which under-shows. Safe: the worst case is a
 *                         friend's shelf looking emptier than it is.
 *   muteSet unknown    -> treat as EMPTY. That SHOWS a blocked person's
 *                         listings, which over-shows. Not a privacy
 *                         breach of anyone else's data, and it is the
 *                         trade the app already chose deliberately
 *                         (ecoinventory-mobile/src/hooks/useMutes.ts:23
 *                         — "if the mutes table doesn't exist yet, return
 *                         an empty set so the feed still renders").
 *
 * So `ready` now means "we have asked", not "both answers are perfect",
 * and nothing blocks a render. `degraded` says which answer we are
 * missing, so a surface can mention it rather than lying by omission.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FriendshipRow = { user_id: string; friend_id: string };

export function useFriendIds(currentUserId: string | undefined) {
  return useQuery({
    queryKey: ["my-friend-ids", currentUserId],
    enabled: !!currentUserId,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);
      if (error) throw error;
      const ids = new Set<string>();
      for (const row of (data ?? []) as FriendshipRow[]) {
        if (row.user_id === currentUserId) ids.add(row.friend_id);
        else ids.add(row.user_id);
      }
      return Array.from(ids);
    },
  });
}

export function useMutedIds(currentUserId: string | undefined) {
  return useQuery({
    queryKey: ["mutes", currentUserId],
    enabled: !!currentUserId,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await (supabase as any)
        .from("mutes")
        .select("muted_id")
        .eq("muter_id", currentUserId!);
      if (error) {
        /* The table may not exist on this project at all. Same choice the
           app makes: warn, return nothing muted, let the page render. */
        console.warn("mutes unavailable:", error.message);
        return [];
      }
      return ((data ?? []) as { muted_id: string }[]).map((r) => r.muted_id);
    },
  });
}

export type VisibilityCtx = {
  friendSet: Set<string>;
  muteSet: Set<string>;
  /** True once both queries have settled, however they settled. Callers
   *  wait on this so a stranger never sees a friends-only row for one
   *  frame — but it is NOT a claim that both answers arrived. */
  ready: boolean;
  /** Which answer is missing, if any. Never blocks rendering. */
  degraded: null | "friends" | "mutes" | "both";
};

/**
 * One call, both sets, plus an explicit readiness flag.
 *
 * A signed-OUT viewer is ready immediately with two empty sets: they have
 * no friends and no blocks, so isItemVisible will show them public and
 * public_anon items and hide everything else. That is the correct answer,
 * not a degraded one — which is why `ready` is true rather than waiting
 * for queries that will never run.
 */
/**
 * The decision, as a pure function, so it can be tested without a renderer.
 *
 * This exists because the bug it fixes was invisible to every check I ran:
 * typecheck passed, the build passed, and the logged-out pages rendered
 * perfectly — while a signed-in visitor would have seen nothing at all,
 * because `mutes` does not exist on this project and the old version
 * treated any error as "not ready". A rule this load-bearing should be
 * checkable in isolation.
 */
export function deriveVisibilityCtx(input: {
  userId: string | undefined;
  friends: { data?: string[]; error?: unknown; isLoading: boolean };
  mutes: { data?: string[]; error?: unknown; isLoading: boolean };
}): VisibilityCtx {
  const { userId, friends, mutes } = input;
  if (!userId) {
    /* Signed out: no friends, no blocks, and that is the correct answer
       rather than a degraded one — so ready immediately, and the two
       queries never run. */
    return {
      friendSet: new Set<string>(),
      muteSet: new Set<string>(),
      ready: true,
      degraded: null,
    };
  }
  const fFailed = !!friends.error;
  const mFailed = !!mutes.error;
  return {
    friendSet: new Set(friends.data ?? []),
    muteSet: new Set(mutes.data ?? []),
    /* SETTLED, not successful. An error is settled. This single word is
       the difference between a degraded page and a blank one. */
    ready: !friends.isLoading && !mutes.isLoading,
    degraded:
      fFailed && mFailed ? "both" : fFailed ? "friends" : mFailed ? "mutes" : null,
  };
}

export function useVisibilityContext(userId: string | undefined): VisibilityCtx {
  const friends = useFriendIds(userId);
  const mutes = useMutedIds(userId);

  return useMemo(
    () =>
      deriveVisibilityCtx({
        userId,
        friends: {
          data: friends.data,
          error: friends.error,
          isLoading: friends.isLoading,
        },
        mutes: {
          data: mutes.data,
          error: mutes.error,
          isLoading: mutes.isLoading,
        },
      }),
    [
      userId,
      friends.data,
      mutes.data,
      friends.error,
      mutes.error,
      friends.isLoading,
      mutes.isLoading,
    ]
  );
}
