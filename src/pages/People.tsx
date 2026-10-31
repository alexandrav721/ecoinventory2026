import { useEffect, useMemo, useState } from "react";
import { isItemVisible } from "@/lib/itemVisibility";
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
      /* This page used to bounce signed-out visitors straight to /auth,
         which made it the second dead end on a site whose landing page
         says "browse freely" — /community links here as "find people to
         follow", so one click out of the marketplace hit a login wall.
         Nothing on this page needs an account to RENDER: the personalised
         parts (your own row, your friends, your blocks, the follow button)
         simply have nothing to say to a stranger, and every one of them is
         already null-guarded. */
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      const fIds = new Set<string>();
      const mIds = new Set<string>();

      if (uid) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("id, city")
          .eq("id", uid)
          .single();
        setMe({ id: uid, city: myProfile?.city ?? null });

        // Friendships (mutual accepted)
        const { data: fr } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .or(`user_id.eq.${uid},friend_id.eq.${uid}`)
          .eq("status", "accepted");
        (fr ?? []).forEach((r: any) => {
          fIds.add(r.user_id === uid ? r.friend_id : r.user_id);
        });
        setFriendIds(fIds);

        /* Blocks, for the item counts below. The website had never read
           this table, so somebody blocked on the phone still had their
           things counted here. */
        const { data: muteRows } = await (supabase as any)
          .from("mutes")
          .select("muted_id")
          .eq("muter_id", uid);
        ((muteRows ?? []) as { muted_id: string }[]).forEach((r) =>
          mIds.add(r.muted_id)
        );
      }

      // All other profiles
      const { data: all } = await supabase
        .from("profiles")
        .select("id, public_display_name, full_name, public_avatar_url, avatar_url, city, state")
        /* A signed-out visitor has no row of their own to leave out.
           PostgREST needs a real uuid here, so the filter is applied only
           when there is one. */
        .neq("id", uid ?? "00000000-0000-0000-0000-000000000000")
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

      /* "N items" per person, counted with the SAME rule that decides what
         you can actually open. It used to count every
         is_available_for_sharing row, friends-only ones included — so a
         stranger's card promised twelve items and their profile showed
         three. A number you cannot click through to is worse than none. */
      const { data: itemsData } = await supabase
        .from("inventory_items")
        .select(
          "user_id, sharing_level, image_urls, is_for_sale, is_for_borrow, is_donated"
        )
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
        .eq("is_available_for_sharing", true)
        .not("is_sold", "is", true)
        .not("is_eliminated", "is", true);
      const itemCount = new Map<string, number>();
      (itemsData ?? []).forEach((i: any) => {
        if (
          !isItemVisible(i, {
            friendSet: fIds,
            muteSet: mIds,
            requirePhoto: true,
          })
        ) {
          return;
        }
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
            {/* The page had no claret anywhere. The counts are the one thing
                worth looking at on a directory card, so they carry the
                accent. "Shareable" is also not a word Loop uses. */}
            <span>
              <span className="font-semibold tabular-nums text-claret">{p.follower_count}</span> in network
            </span>
            <span>
              <span className="font-semibold tabular-nums text-claret">{p.available_count}</span> to lend
            </span>
          </div>
          <Button
            size="sm"
            variant={following ? "outline" : "default"}
            onClick={() => handleToggle(p)}
            className="w-full"
          >
            {following ? <><UserCheck className="w-4 h-4 mr-1" />In your network</> : <><UserPlus className="w-4 h-4 mr-1" />Add to network</>}
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
            <h1 className="font-display-wonk text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.05]">People</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Neighbours with things to lend.
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
                <h2 className="font-display-wonk text-2xl">Near you</h2>
                {myCity && (
                  <span className="text-xs text-muted-foreground">
                    Prioritizing {myCity}
                  </span>
                )}
              </div>
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everyone we'd suggest is already in your network. Nice.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((p) => <PersonCard key={p.id} p={p} />)}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-display-wonk text-2xl mb-3">In your network ({followingList.length})</h2>
              {followingList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one in your network yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followingList.map((p) => <PersonCard key={p.id} p={p} />)}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-display-wonk text-2xl mb-3">Friends ({friendsList.length})</h2>
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
