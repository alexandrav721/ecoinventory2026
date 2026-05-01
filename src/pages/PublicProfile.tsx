import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Package, UserCheck, UserPlus, Settings, Sparkles, Inbox, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useFollows } from "@/hooks/useFollows";
import { ProfileStatsHub } from "@/components/profile/ProfileStatsHub";

interface Props {
  selfMode?: boolean;
}

export default function PublicProfile({ selfMode = false }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meId, setMeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [totalOwned, setTotalOwned] = useState(0);
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
        .maybeSingle();

      if (!prof) {
        // Fallback so the page never hangs on "Loading…"
        const { data: { user } } = await supabase.auth.getUser();
        const isSelf = meId === targetId;
        setProfile({
          id: targetId,
          display_name: isSelf ? (user?.user_metadata?.full_name || user?.email || "You") : "Member",
          avatar_url: isSelf ? user?.user_metadata?.avatar_url : null,
          city: null,
          state: null,
        });
        setItems([]);
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

      const [{ count: fCount }, { count: ingCount }, { count: ownedCount }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", targetId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
        supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("user_id", targetId),
      ]);
      setFollowerCount(fCount ?? 0);
      setFollowingCount(ingCount ?? 0);
      setTotalOwned(ownedCount ?? 0);

      setLoading(false);
    })();
  }, [targetId, meId]);

  const handleToggle = async () => {
    if (!profile) return;
    if (isFollowing(profile.id)) {
      const err = await unfollow(profile.id);
      if (err) toast.error("Could not remove from network");
      else { toast.success("Removed from your network"); setFollowerCount((c) => c - 1); }
    } else {
      const err = await follow(profile.id);
      if (err) toast.error("Could not add to network");
      else { toast.success("Added to your network"); setFollowerCount((c) => c + 1); }
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  const isSelf = meId === profile.id;

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        {/* Premium hero */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl animate-fade-in">
          {/* Decorative gradient + grain */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.30),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative px-6 sm:px-10 py-10 sm:py-14">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/60 mb-6">
              <span className="h-px w-8 bg-white/30" />
              {isSelf ? "Your Loop" : "Member profile"}
              {isFriend && <Badge className="ml-2 bg-white/15 text-white hover:bg-white/20 border-0 tracking-normal">Connected</Badge>}
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <Avatar className="h-28 w-28 ring-2 ring-white/30 ring-offset-4 ring-offset-slate-950 shadow-2xl">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-3xl font-display font-semibold text-white bg-gradient-to-br from-primary via-primary/80 to-accent">
                  {(profile.display_name ?? "")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
                    {isSelf ? <>Hello, <em className="italic text-white/95">{profile.display_name?.split(" ")[0]}</em>.</> : <em className="italic">{profile.display_name}</em>}
                  </h1>
                  {(profile.city || profile.state) && (
                    <p className="text-sm text-white/60 flex items-center gap-1.5 mt-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {/* Inline pill chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] text-white/80">
                    <strong className="font-semibold text-white tabular-nums">{totalOwned}</strong>
                    <span className="text-white/60">items owned</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] text-white/80">
                    <strong className="font-semibold text-white tabular-nums">{items.length}</strong>
                    <span className="text-white/60">shared</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] text-white/80">
                    <strong className="font-semibold text-white tabular-nums">{followerCount}</strong>
                    <span className="text-white/60">in network</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                {isSelf ? (
                  <>
                    <Button asChild size="sm" className="bg-white text-slate-900 hover:bg-white/90 shadow-md">
                      <Link to="/dashboard/add-item"><Sparkles className="w-4 h-4 mr-1.5" />Add an item</Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" aria-label="Edit profile" title="Edit profile" className="text-white/80 hover:bg-white/10 hover:text-white h-9 w-9">
                      <Link to="/profile-settings"><Settings className="w-4 h-4" /></Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleToggle}
                    className={isFollowing(profile.id)
                      ? "bg-transparent border border-white/30 text-white hover:bg-white/10"
                      : "bg-white text-slate-900 hover:bg-white/90 shadow-md"}
                  >
                    {isFollowing(profile.id) ? <><UserCheck className="w-4 h-4 mr-1.5" />In your network</> : <><UserPlus className="w-4 h-4 mr-1.5" />Add to network</>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {isSelf && <ProfileStatsHub userId={profile.id} />}

        {/* Activity / notifications — editorial cards */}
        {isSelf && (
          <section className="space-y-5 animate-fade-in">
            <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">
                  Recent activity
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                  What's <em className="italic">happening</em> around you
                </h2>
              </div>
              <Link to="/notifications" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Borrow request */}
              <article className="group relative rounded-xl border border-border/70 bg-card p-5 hover:border-foreground/30 hover:shadow-sm transition-all">
                <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-primary" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Inbox className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Borrow request
                  </span>
                </div>
                <p className="font-display text-lg leading-snug text-foreground">
                  <em className="italic">Maya R.</em> wants to borrow your <em className="italic">Dyson V11</em>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Requested for next weekend · 2h ago
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button size="sm" className="h-8 text-xs flex-1">Respond</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs">Later</Button>
                </div>
              </article>

              {/* New follower */}
              <article className="group relative rounded-xl border border-border/70 bg-card p-5 hover:border-foreground/30 hover:shadow-sm transition-all">
                <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-primary" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    New follower
                  </span>
                </div>
                <p className="font-display text-lg leading-snug text-foreground">
                  <em className="italic">Alex K.</em> from Park Slope started following you
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  3 mutual neighbors · 5h ago
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button size="sm" variant="outline" className="h-8 text-xs flex-1">Follow back</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs">View</Button>
                </div>
              </article>

              {/* Item interest */}
              <article className="group relative rounded-xl border border-border/70 bg-card p-5 hover:border-foreground/30 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Trending
                  </span>
                </div>
                <p className="font-display text-lg leading-snug text-foreground">
                  <em className="italic">7 neighbors</em> searched for a <em className="italic">Peloton</em> this week
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  In Brooklyn · updated daily
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button size="sm" variant="outline" className="h-8 text-xs flex-1">List yours</Button>
                </div>
              </article>
            </div>
          </section>
        )}


        {/* Items: editorial gallery */}
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">
                {isSelf ? "Your collection" : "Available now"}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                {isSelf ? <>Things you've made <em className="italic">shareable</em></> : <>Available to <em className="italic">borrow or buy</em></>}
              </h2>
            </div>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground tabular-nums hidden sm:block">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="p-10 text-center space-y-3">
                <Package className="w-10 h-10 mx-auto text-muted-foreground/60" />
                <p className="font-display text-lg italic text-muted-foreground">
                  {isSelf
                    ? "Nothing shareable yet — your collection is waiting."
                    : "Nothing publicly available right now."}
                </p>
                {isSelf && (
                  <Button asChild size="sm" className="mt-2">
                    <Link to="/dashboard/add-item"><Sparkles className="w-4 h-4 mr-1.5" />Add your first</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((it) => (
                <Card
                  key={it.id}
                  className="group overflow-hidden border-border/60 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 rounded-2xl"
                >
                  <div className="aspect-square bg-stone-100 overflow-hidden relative">
                    {it.image_urls?.[0] ? (
                      <img
                        src={it.image_urls[0]}
                        alt={it.name}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    {(it.sharing_price === 0 || it.sharing_price === null) && it.is_available_for_sharing && (
                      <Badge className="absolute top-2 left-2 bg-white/95 text-slate-900 hover:bg-white border-0 text-[10px] uppercase tracking-wider shadow-sm">
                        Free
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3.5 space-y-1">
                    <div className="font-display font-semibold text-[15px] truncate leading-tight">{it.name}</div>
                    {it.brand && (
                      <div className="text-xs text-muted-foreground truncate italic">{it.brand}</div>
                    )}
                    {typeof it.sharing_price === "number" && it.sharing_price > 0 && (
                      <div className="text-xs font-medium text-primary pt-0.5 tabular-nums">
                        ${it.sharing_price}<span className="text-muted-foreground font-normal"> / borrow</span>
                      </div>
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
