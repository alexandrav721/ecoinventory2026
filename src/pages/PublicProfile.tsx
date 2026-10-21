import { useEffect, useState, useMemo } from "react";
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
import { isItemVisible } from "@/lib/itemVisibility";
import { useVisibilityContext } from "@/hooks/useVisibilityContext";
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

  /* THE PRIVACY GATE for this page. `items` holds what the query returned;
     everything rendered reads `visibleItems`.

     Viewing your OWN profile is exempt: it is your shelf, and you are
     entitled to see your private and unlisted things on it. For anyone
     else the app's rule decides, with requireOffered deliberately OFF —
     a profile is someone's shelf rather than a browse surface, and the
     app's own profile screen likewise shows things that are catalogued but
     not currently listed. requirePhoto is on, because Loop's photo rule
     holds everywhere a stranger looks. */
  const vis = useVisibilityContext(meId ?? undefined);
  const viewingSelf = !!meId && meId === targetId;
  const visibleItems = useMemo(() => {
    if (viewingSelf) return items;
    if (!vis.ready) return [];
    return items.filter((it) =>
      isItemVisible(it, {
        friendSet: vis.friendSet,
        muteSet: vis.muteSet,
        requirePhoto: true,
      })
    );
  }, [items, viewingSelf, vis.ready, vis.friendSet, vis.muteSet]);

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

      /* This comment used to read "if self, all items; if friend, all
         shared; else, only available_for_sharing" — and the query did
         exactly one of those three things, unconditionally, with no
         sharing_level in the select at all. So a stranger opening
         someone's profile saw every friends-only item they own. The
         branching the comment described now actually happens, below, in
         isItemVisible.

         user_id is in the select because the rule checks the owner
         against the viewer's friend and block sets. */
      const itemQuery = supabase
        .from("inventory_items")
        .select("id, user_id, name, description, image_urls, condition, brand, sharing_price, rent_price, rent_window, is_available_for_sharing, sharing_level, is_for_sale, is_for_borrow, is_donated, categories(name, icon)")
        .eq("user_id", targetId)
        .eq("is_available_for_sharing", true)
        .not("is_sold", "is", true)
        .not("is_eliminated", "is", true)
        .order("created_at", { ascending: false })
        .limit(60);

      const { data: it } = await itemQuery;
      setItems(it ?? []);

      const [{ count: fCount }, { count: ingCount }, { count: ownedCount }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", targetId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
        /* "Items owned" counted archived rows, so the website's number sat
           above the app's for the same person. The app's profile count
           excludes is_eliminated and nothing else
           (src/hooks/useDrawerProfile.ts:43-47); match it exactly. */
        supabase
          .from("inventory_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", targetId)
          .not("is_eliminated", "is", true),
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

        {/* PAPER, NOT A BLACK SLAB.
            This hero was bg-slate-950 with shadow-2xl, two radial gradient
            washes, an feTurbulence noise-grain overlay at 4% and a 288px
            blurred glow blob in the corner — four decorative layers on the
            page you open most. It is the same heavy slab the landing page
            was rebuilt to remove, and slate-950 is a blue-black that
            belongs to no Loop palette.

            Paper ground, a hairline, and the name in Instrument Serif
            italic. The person is the subject; the panel was competing. */}
        <section
          className="relative overflow-hidden rounded-3xl border border-border"
          style={{ background: "hsl(var(--champagne))" }}
        >
          <div className="relative px-6 sm:px-10 py-10 sm:py-14">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-6">
              <span className="h-px w-8 bg-border" />
              {isSelf ? "Your Loop" : "Member profile"}
              {isFriend && <Badge className="ml-2 bg-claret/10 text-claret hover:bg-claret/15 border-0 tracking-normal">Connected</Badge>}
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <Avatar className="h-28 w-28 ring-1 ring-border ring-offset-4 ring-offset-[hsl(var(--champagne))]">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-3xl font-display text-white bg-claret">
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
                    {isSelf ? <>Hello, <em className="italic text-claret">{profile.display_name?.split(" ")[0]}</em>.</> : <em className="italic">{profile.display_name}</em>}
                  </h1>
                  {(profile.city || profile.state) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {/* Inline pill chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-claret/10 border border-white/15 text-[12px] text-muted-foreground">
                    <strong className="font-semibold text-white tabular-nums">{totalOwned}</strong>
                    <span className="text-muted-foreground">items owned</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-claret/10 border border-white/15 text-[12px] text-muted-foreground">
                    <strong className="font-semibold text-white tabular-nums">{visibleItems.length}</strong>
                    <span className="text-muted-foreground">shared</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-claret/10 border border-white/15 text-[12px] text-muted-foreground">
                    <strong className="font-semibold text-white tabular-nums">{followerCount}</strong>
                    <span className="text-muted-foreground">in network</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                {isSelf ? (
                  <>
                    <Button asChild size="sm" className="bg-white text-slate-900 hover:bg-white/90 shadow-md">
                      <Link to="/dashboard/add-item"><Sparkles className="w-4 h-4 mr-1.5" />Add an item</Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" aria-label="Edit profile" title="Edit profile" className="text-muted-foreground hover:bg-claret/10 hover:text-white h-9 w-9">
                      <Link to="/profile-settings"><Settings className="w-4 h-4" /></Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleToggle}
                    className={isFollowing(profile.id)
                      ? "bg-transparent border border-white/30 text-white hover:bg-claret/10"
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
        {/* THE "RECENT ACTIVITY" FEED THAT WAS HERE WAS ENTIRELY INVENTED.
            115 lines of hard-coded fiction shown only to you, on your own
            profile: "Maya R. wants to borrow your Dyson V11", "3 neighbors
            are interested in your Canon EOS R", an "est. $180 resale".
            None of it came from the database. There are no Maya R., no
            Dyson and no Canon in this account, and the resale figure is a
            number the product refuses to state even when it CAN compute a
            depreciation estimate.

            Deleted rather than rebuilt. A real activity feed means reading
            borrowing_requests, item_likes and notifications for this user
            and rendering what is actually there — worth doing, and not
            something to fake in the meantime. An honest blank is better
            than a convincing lie about your own account. */}


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
            {visibleItems.length > 0 && (
              <span className="text-sm text-muted-foreground tabular-nums hidden sm:block">
                {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {visibleItems.length === 0 ? (
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
              {visibleItems.map((it) => (
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
