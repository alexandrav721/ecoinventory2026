import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useFollows } from "@/hooks/useFollows";

type PublicProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  follower_count: number;
  available_count: number;
};

export default function People() {
  const navigate = useNavigate();
  const [me, setMe] = useState<{ id: string; city: string | null } | null>(null);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const { isFollowing, follow, unfollow } = useFollows(me?.id ?? null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id, city")
        .eq("id", user.id)
        .single();
      setMe({ id: user.id, city: myProfile?.city ?? null });

      // Friendships (mutual accepted)
      const { data: fr } = await supabase
        .from("friendships")
        .select("user_id, friend_id, status")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");
      const fIds = new Set<string>();
      (fr ?? []).forEach((r: any) => {
        fIds.add(r.user_id === user.id ? r.friend_id : r.user_id);
      });
      setFriendIds(fIds);

      // All other profiles
      const { data: all } = await supabase
        .from("profiles")
        .select("id, public_display_name, full_name, public_avatar_url, avatar_url, city, state")
        .neq("id", user.id)
        .limit(200);

      const ids = (all ?? []).map((p: any) => p.id);

      // Follower counts
      const { data: followsData } = await supabase
        .from("follows")
        .select("followee_id")
        .in("followee_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const followerCount = new Map<string, number>();
      (followsData ?? []).forEach((f: any) => {
        followerCount.set(f.followee_id, (followerCount.get(f.followee_id) ?? 0) + 1);
      });

      // Available items count per user (publicly available for sharing)
      const { data: itemsData } = await supabase
        .from("inventory_items")
        .select("user_id")
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
        .eq("is_available_for_sharing", true);
      const itemCount = new Map<string, number>();
      (itemsData ?? []).forEach((i: any) => {
        itemCount.set(i.user_id, (itemCount.get(i.user_id) ?? 0) + 1);
      });

      const mapped: PublicProfile[] = (all ?? []).map((p: any) => ({
        id: p.id,
        display_name: p.public_display_name || p.full_name || "Member",
        avatar_url: p.public_avatar_url || p.avatar_url,
        city: p.city,
        state: p.state,
        follower_count: followerCount.get(p.id) ?? 0,
        available_count: itemCount.get(p.id) ?? 0,
      }));
      setProfiles(mapped);
      setLoading(false);
    })();
  }, [navigate]);

  const myCity = me?.city ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.display_name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const suggestions = useMemo(() => {
    // neighborhood-first: same city, then everyone else, exclude already-following
    return [...filtered]
      .filter((p) => !isFollowing(p.id))
      .sort((a, b) => {
        const aSame = myCity && a.city === myCity ? 1 : 0;
        const bSame = myCity && b.city === myCity ? 1 : 0;
        if (aSame !== bSame) return bSame - aSame;
        return b.available_count - a.available_count;
      })
      .slice(0, 12);
  }, [filtered, myCity, isFollowing]);

  const followingList = useMemo(
    () => filtered.filter((p) => isFollowing(p.id)),
    [filtered, isFollowing]
  );
  const friendsList = useMemo(
    () => filtered.filter((p) => friendIds.has(p.id)),
    [filtered, friendIds]
  );

  const handleToggle = async (p: PublicProfile) => {
    if (isFollowing(p.id)) {
      const err = await unfollow(p.id);
      if (err) toast.error("Could not remove from network");
      else toast.success(`Removed ${p.display_name} from your network`);
    } else {
      const err = await follow(p.id);
      if (err) toast.error("Could not add to network");
      else toast.success(`Added ${p.display_name} to your network`);
    }
  };

  const PersonCard = ({ p }: { p: PublicProfile }) => {
    const following = isFollowing(p.id);
    const isFriend = friendIds.has(p.id);
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col gap-3">
          <Link to={`/profile/${p.id}`} className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback>{p.display_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{p.display_name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                {p.city && <><MapPin className="w-3 h-3" />{p.city}{p.state ? `, ${p.state}` : ""}</>}
              </div>
            </div>
            {isFriend && <Badge variant="secondary" className="text-xs">Friend</Badge>}
          </Link>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{p.follower_count} in network</span>
            <span>{p.available_count} shareable</span>
          </div>
          <Button
            size="sm"
            variant={following ? "outline" : "default"}
            onClick={() => handleToggle(p)}
            className="w-full"
          >
            {following ? <><UserCheck className="w-4 h-4 mr-1" />Following</> : <><UserPlus className="w-4 h-4 mr-1" />Follow</>}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold">People</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Discover neighbors with stuff to lend, follow inspiring members, and see your friends.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/me"><Users className="w-4 h-4 mr-1" />My profile</Link>
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or neighborhood…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-display">Suggested for you</h2>
                {myCity && (
                  <span className="text-xs text-muted-foreground">
                    Prioritizing {myCity}
                  </span>
                )}
              </div>
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">You're following everyone we'd suggest. Nice.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((p) => <PersonCard key={p.id} p={p} />)}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-display mb-3">Following ({followingList.length})</h2>
              {followingList.length === 0 ? (
                <p className="text-sm text-muted-foreground">You're not following anyone yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followingList.map((p) => <PersonCard key={p.id} p={p} />)}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-display mb-3">Friends ({friendsList.length})</h2>
              {friendsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No friends yet. Friendships are mutual and unlock shared items.{" "}
                  <Link to="/friends" className="underline">Manage friends</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsList.map((p) => <PersonCard key={p.id} p={p} />)}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
