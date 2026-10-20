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
 * FAILURE IS CLOSED, NOT OPEN. If either query errors the hook reports
 * `ready: false` and callers render nothing rather than rendering
 * unfiltered rows. An empty friendSet from a failed query is
 * indistinguishable from "this person has no friends", and in the second
 * case hiding a friend's item is a blank shelf while in the first case
 * showing it is a broken promise. The app returns an empty mute set on
 * error for the same reason in reverse — there, an empty set only widens
 * what you see by the people you blocked, and the feed still renders.
 * Here the stake is other people's items, so we wait.
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
      if (error) throw error;
      return ((data ?? []) as { muted_id: string }[]).map((r) => r.muted_id);
    },
  });
}

export type VisibilityCtx = {
  friendSet: Set<string>;
  muteSet: Set<string>;
  /** False while loading or after an error — callers must not render rows. */
  ready: boolean;
  /** True when a query failed, so the caller can say so instead of showing nothing silently. */
  failed: boolean;
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
export function useVisibilityContext(userId: string | undefined): VisibilityCtx {
  const friends = useFriendIds(userId);
  const mutes = useMutedIds(userId);

  return useMemo(() => {
    if (!userId) {
      return {
        friendSet: new Set<string>(),
        muteSet: new Set<string>(),
        ready: true,
        failed: false,
      };
    }
    const failed = !!friends.error || !!mutes.error;
    return {
      friendSet: new Set(friends.data ?? []),
      muteSet: new Set(mutes.data ?? []),
      ready: !failed && !friends.isLoading && !mutes.isLoading,
      failed,
    };
  }, [
    userId,
    friends.data,
    mutes.data,
    friends.error,
    mutes.error,
    friends.isLoading,
    mutes.isLoading,
  ]);
}
