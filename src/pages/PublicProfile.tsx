import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/DashboardNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Package, UserCheck, UserPlus, Settings } from "lucide-react";
import { toast } from "sonner";
import { useFollows } from "@/hooks/useFollows";

interface Props {
  selfMode?: boolean;
}

export default function PublicProfile({ selfMode = false }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meId, setMeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isFollowing, follow, unfollow } = useFollows(meId);

  const targetId = selfMode ? meId : id;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setMeId(user.id);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      setLoading(true);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, public_display_name, friends_display_name, full_name, public_avatar_url, friends_avatar_url, avatar_url, city, state")
        .eq("id", targetId)
        .single();

      if (!prof) {
        setLoading(false);
        return;
      }

      // Choose display info: friends view if we are friends, else public
      let amFriend = false;
      if (meId && meId !== targetId) {
        const { data: fr } = await supabase
          .from("friendships")
          .select("status")
          .or(`and(user_id.eq.${meId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${meId})`)
          .eq("status", "accepted")
          .maybeSingle();
        amFriend = !!fr;
      }
      setIsFriend(amFriend);

      const isSelf = meId === targetId;
      setProfile({
        id: prof.id,
        display_name: isSelf
          ? prof.full_name
          : amFriend
          ? prof.friends_display_name || prof.full_name
          : prof.public_display_name || prof.full_name || "Member",
        avatar_url: isSelf
          ? prof.avatar_url
          : amFriend
          ? prof.friends_avatar_url || prof.avatar_url
          : prof.public_avatar_url || prof.avatar_url,
        city: prof.city,
        state: prof.state,
      });

      // Items: if self, all items; if friend, all shared; else, only available_for_sharing
      const itemQuery = supabase
        .from("inventory_items")
        .select("id, name, description, image_urls, condition, brand, sharing_price, is_available_for_sharing, categories(name, icon)")
        .eq("user_id", targetId)
        .eq("is_available_for_sharing", true)
        .order("created_at", { ascending: false })
        .limit(60);

      const { data: it } = await itemQuery;
      setItems(it ?? []);

      const [{ count: fCount }, { count: ingCount }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", targetId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
      ]);
      setFollowerCount(fCount ?? 0);
      setFollowingCount(ingCount ?? 0);

      setLoading(false);
    })();
  }, [targetId, meId]);

  const handleToggle = async () => {
    if (!profile) return;
    if (isFollowing(profile.id)) {
      const err = await unfollow(profile.id);
      if (err) toast.error("Could not unfollow");
      else { toast.success("Unfollowed"); setFollowerCount((c) => c - 1); }
    } else {
      const err = await follow(profile.id);
      if (err) toast.error("Could not follow");
      else { toast.success("Following"); setFollowerCount((c) => c + 1); }
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  const isSelf = meId === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{profile.display_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-semibold">{profile.display_name}</h1>
                {isFriend && <Badge variant="secondary">Friend</Badge>}
                {isSelf && <Badge variant="outline">You</Badge>}
              </div>
              {(profile.city || profile.state) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="flex gap-6 text-sm pt-2">
                <span><strong>{followerCount}</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong>{followingCount}</strong> <span className="text-muted-foreground">following</span></span>
                <span><strong>{items.length}</strong> <span className="text-muted-foreground">shareable</span></span>
              </div>
            </div>
            <div className="flex gap-2">
              {isSelf ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile-settings"><Settings className="w-4 h-4 mr-1" />Edit profile</Link>
                </Button>
              ) : (
                <Button size="sm" variant={isFollowing(profile.id) ? "outline" : "default"} onClick={handleToggle}>
                  {isFollowing(profile.id) ? <><UserCheck className="w-4 h-4 mr-1" />Following</> : <><UserPlus className="w-4 h-4 mr-1" />Follow</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-xl font-display mb-3">
            {isSelf ? "Items you've made shareable" : "Available to borrow or buy"}
          </h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isSelf
                ? "You haven't made any items publicly available yet."
                : "Nothing publicly available right now."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <Card key={it.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {it.image_urls?.[0] ? (
                      <img src={it.image_urls[0]} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <div className="font-medium text-sm truncate">{it.name}</div>
                    {it.brand && <div className="text-xs text-muted-foreground truncate">{it.brand}</div>}
                    {typeof it.sharing_price === "number" && it.sharing_price > 0 && (
                      <Badge variant="outline" className="text-xs">${it.sharing_price}/borrow</Badge>
                    )}
                    {(it.sharing_price === 0 || it.sharing_price === null) && it.is_available_for_sharing && (
                      <Badge variant="secondary" className="text-xs">Free to borrow</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
