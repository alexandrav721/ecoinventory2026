import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFollows = (currentUserId: string | null) => {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUserId) {
      setFollowingIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", currentUserId);
    setFollowingIds(new Set((data ?? []).map((r: any) => r.followee_id)));
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const follow = async (followeeId: string) => {
    if (!currentUserId) return;
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: currentUserId, followee_id: followeeId });
    if (!error) setFollowingIds((s) => new Set(s).add(followeeId));
    return error;
  };

  const unfollow = async (followeeId: string) => {
    if (!currentUserId) return;
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("followee_id", followeeId);
    if (!error) {
      setFollowingIds((s) => {
        const n = new Set(s);
        n.delete(followeeId);
        return n;
      });
    }
    return error;
  };

  const isFollowing = (id: string) => followingIds.has(id);

  return { followingIds, isFollowing, follow, unfollow, loading, refresh };
};
