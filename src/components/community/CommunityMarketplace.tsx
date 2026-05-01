import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, HandHeart, ShoppingCart, MessageCircle, Search, Navigation, Lock, Users, Globe, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { BorrowRequestDialog } from "@/components/friends/BorrowRequestDialog";
import { useViewerLocation, distanceMiles } from "@/hooks/useViewerLocation";

interface OwnerProfile {
  id: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  public_display_name: string | null;
  full_name: string | null;
  public_avatar_url: string | null;
  avatar_url: string | null;
}

interface MarketItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_urls: string[] | null;
  condition: string | null;
  sharing_price: number | null;
  is_for_borrow: boolean;
  is_for_sale: boolean;
  owner: OwnerProfile | null;
  distance: number | null;
}

const PAGE_SIZE = 24;
type Mode = "all" | "borrow" | "buy";
type SortBy = "distance" | "price_high" | "price_low" | "newest";

export function CommunityMarketplace() {
  const navigate = useNavigate();
  const { location, loading: locLoading, denied, requestBrowserLocation } = useViewerLocation();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [audience, setAudience] = useState<"all" | "friends" | "community">("all");
  const [search, setSearch] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<string>("all");
  const [borrowItem, setBorrowItem] = useState<MarketItem | null>(null);
  const [mode, setMode] = useState<Mode>("all");
  const [sortBy, setSortBy] = useState<SortBy>("distance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setAuthed(!!session);
      setCurrentUserId(uid);
      if (uid) {
        const { data: fr } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .eq("status", "accepted")
          .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
        const ids = new Set<string>();
        (fr || []).forEach((f: any) => {
          ids.add(f.user_id === uid ? f.friend_id : f.user_id);
        });
        setFriendIds(ids);
      }
    });
  }, []);

  // Read ?q= URL param on mount, and listen for hero search events
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") setSearch(detail);
    };
    window.addEventListener("marketplace:search", handler);
    return () => window.removeEventListener("marketplace:search", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("inventory_items")
        .select("id, user_id, name, description, image_urls, condition, sharing_price, is_for_borrow, is_for_sale")
        .eq("is_available_for_sharing", true)
        .eq("is_donated", false)
        .eq("is_sold", false)
        .eq("is_eliminated", false)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE * 4);

      if (error || !rows) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const ownerIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let owners: Record<string, OwnerProfile> = {};
      if (ownerIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, city, latitude, longitude, public_display_name, full_name, public_avatar_url, avatar_url")
          .in("id", ownerIds);
        (profiles || []).forEach((p: any) => { owners[p.id] = p; });
      }

      const enriched: MarketItem[] = rows.map((r: any) => {
        const owner = owners[r.user_id] || null;
        let distance: number | null = null;
        if (
          location &&
          owner?.latitude != null &&
          owner?.longitude != null
        ) {
          distance = distanceMiles(
            location.latitude,
            location.longitude,
            Number(owner.latitude),
            Number(owner.longitude)
          );
        }
        return { ...r, owner, distance };
      });

      // Default ordering by distance (re-sorted later by sortBy)
      enriched.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

      if (!cancelled) {
        setItems(enriched);
        setLoading(false);
      }
    };
    fetchItems();
    return () => { cancelled = true; };
  }, [location]);

  const filtered = useMemo(() => {
    const list = items.filter((it) => {
      // Audience filter
      if (audience === "friends") {
        if (!currentUserId || !friendIds.has(it.user_id)) return false;
      } else if (audience === "community") {
        if (currentUserId && friendIds.has(it.user_id)) return false;
      }
      // Mode filter (All / Borrow / Buy)
      if (mode === "borrow" && !it.is_for_borrow) return false;
      if (mode === "buy" && !it.is_for_sale) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${it.name} ${it.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (distanceFilter !== "all" && it.distance != null) {
        if (it.distance > parseFloat(distanceFilter)) return false;
      }
      // When a distance filter is applied but item has no distance, exclude
      if (distanceFilter !== "all" && it.distance == null && location) {
        return false;
      }
      return true;
    });

    const priceOf = (it: MarketItem) => (it.sharing_price != null ? Number(it.sharing_price) : -1);
    const sorted = [...list];
    if (sortBy === "price_high") {
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
    } else if (sortBy === "price_low") {
      // Lowest first, but push items with no price to the end
      sorted.sort((a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa < 0 && pb < 0) return 0;
        if (pa < 0) return 1;
        if (pb < 0) return -1;
        return pa - pb;
      });
    } else if (sortBy === "newest") {
      // Already roughly newest from query; keep as-is fallback
    }
    // "distance" => keep distance-sorted order from items state
    return sorted;
  }, [items, search, distanceFilter, location, audience, friendIds, currentUserId, mode, sortBy]);

  const borrowCount = items.filter((it) => it.is_for_borrow).length;
  const buyCount = items.filter((it) => it.is_for_sale).length;

  const requireAuth = (action: string) => {
    toast.info(`Sign in to ${action}`);
    navigate("/auth");
  };

  const handleBorrow = (item: MarketItem) => {
    if (!authed) return requireAuth("borrow this item");
    setBorrowItem(item);
  };

  const handleBuy = (item: MarketItem) => {
    if (!authed) return requireAuth("buy this item");
    handleMessage(item, `Hi! I'm interested in buying your ${item.name}.`);
  };

  const handleMessage = async (item: MarketItem, prefill?: string) => {
    if (!authed) return requireAuth("message the owner");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return requireAuth("message the owner");
    if (user.id === item.user_id) {
      toast.info("This is your own item");
      return;
    }
    try {
      // Create a conversation
      const { data: convo, error: convErr } = await supabase
        .from("conversations")
        .insert({ item_id: item.id })
        .select()
        .single();
      if (convErr || !convo) throw convErr;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user.id },
        { conversation_id: convo.id, user_id: item.user_id },
      ]);

      if (prefill) {
        await supabase.from("messages").insert({
          conversation_id: convo.id,
          sender_id: user.id,
          content: prefill,
        });
      }

      toast.success("Conversation started");
      navigate("/messages");
    } catch (e) {
      console.error(e);
      toast.error("Could not start conversation");
    }
  };

  const ItemCard = ({ item }: { item: MarketItem }) => {
    const ownerName = item.owner?.public_display_name || item.owner?.full_name || "Member";
    const ownerAvatar = item.owner?.public_avatar_url || item.owner?.avatar_url || undefined;
    const cover = item.image_urls?.[0];
    const showBorrow = item.is_for_borrow;
    const showBuy = item.is_for_sale;
    const both = showBorrow && showBuy;
    const isFreeBorrow = showBorrow && (!item.sharing_price || Number(item.sharing_price) === 0);

    return (
      <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
        <Link to={`/marketplace/item/${item.id}`} className="block group">
          <div className="aspect-[4/3] relative bg-secondary/40 overflow-hidden">
            {cover ? (
              <img src={cover} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No photo
              </div>
            )}
            {item.distance != null && (
              <Badge variant="secondary" className="absolute top-2 right-2 bg-background/90 backdrop-blur gap-1">
                <MapPin className="w-3 h-3" />
                {item.distance < 1 ? "<1" : item.distance.toFixed(1)} mi
              </Badge>
            )}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {both && (
                <Badge className="bg-foreground text-background">Lend or buy</Badge>
              )}
              {!both && isFreeBorrow && (
                <Badge className="bg-primary text-primary-foreground">Free to borrow</Badge>
              )}
            </div>
          </div>
        </Link>
        <CardContent className="p-4 space-y-3">
          <Link to={`/marketplace/item/${item.id}`} className="block hover:opacity-90">
            <div>
              <h3 className="font-semibold truncate">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-3">
              {item.condition && <Badge variant="outline" className="capitalize">{item.condition}</Badge>}
              {showBuy && item.sharing_price != null && Number(item.sharing_price) > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  ${Number(item.sharing_price).toFixed(2)}
                </Badge>
              )}
            </div>
          </Link>

          <div className="pt-3 border-t flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={ownerAvatar} />
                <AvatarFallback className="text-xs">{ownerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm truncate">{ownerName}</div>
                {item.owner?.city && (
                  <div className="text-xs text-muted-foreground truncate">{item.owner.city}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMessage(item); }}
                title="Message owner"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              {showBorrow && (
                <Button
                  size="sm"
                  variant={both ? "outline" : "default"}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBorrow(item); }}
                >
                  <HandHeart className="w-4 h-4 mr-1" /> Borrow
                </Button>
              )}
              {showBuy && (
                <Button size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuy(item); }}>
                  <ShoppingCart className="w-4 h-4 mr-1" /> Buy
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGrid = (list: MarketItem[]) => {
    if (loading) {
      return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      const noItemsAtAll = items.length === 0;
      return (
        <div className="text-center py-16 text-muted-foreground">
          {noItemsAtAll ? (
            <>
              <p>No one in your area has shared items yet.</p>
              <p className="text-sm mt-1">
                Be the first — <Link to="/dashboard/inventory" className="underline hover:text-foreground">share something from your inventory</Link>.
              </p>
            </>
          ) : (
            <>
              <p>No items match your filters.</p>
              <p className="text-sm mt-1">Try widening the distance or clearing filters.</p>
            </>
          )}
        </div>
      );
    }
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.slice(0, PAGE_SIZE).map((it) => (
          <ItemCard key={it.id} item={it} />
        ))}
      </div>
    );
  };

  const FiltersPanel = () => (
    <div className="space-y-7">
      {/* Mode: All / Borrow / Buy */}
      <div>
        <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 block">
          Browse
        </Label>
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          className="space-y-2"
        >
          <label
            htmlFor="mode-all"
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-all" value="all" />
              <span className="text-sm">All</span>
            </div>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </label>
          <label
            htmlFor="mode-borrow"
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-borrow" value="borrow" />
              <HandHeart className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">Borrow</span>
            </div>
            <span className="text-xs text-muted-foreground">{borrowCount}</span>
          </label>
          <label
            htmlFor="mode-buy"
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-buy" value="buy" />
              <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">Buy</span>
            </div>
            <span className="text-xs text-muted-foreground">{buyCount}</span>
          </label>
        </RadioGroup>
      </div>

      {/* Distance */}
      <div>
        <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 block">
          Distance
        </Label>
        <Select value={distanceFilter} onValueChange={setDistanceFilter}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any distance</SelectItem>
            <SelectItem value="1">Within 1 mi</SelectItem>
            <SelectItem value="5">Within 5 mi</SelectItem>
            <SelectItem value="15">Within 15 mi</SelectItem>
            <SelectItem value="50">Within 50 mi</SelectItem>
          </SelectContent>
        </Select>
        {!location && !locLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={requestBrowserLocation}
            className="w-full mt-2 gap-2"
          >
            <Navigation className="w-3.5 h-3.5" />
            {denied ? "Location blocked" : "Use my location"}
          </Button>
        )}
      </div>

      {/* Audience (signed-in only) */}
      {authed && (
        <div>
          <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 block">
            From
          </Label>
          <RadioGroup
            value={audience}
            onValueChange={(v) => setAudience(v as typeof audience)}
            className="space-y-2"
          >
            <label htmlFor="aud-all" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer">
              <RadioGroupItem id="aud-all" value="all" />
              <span className="text-sm">Everyone</span>
            </label>
            <label htmlFor="aud-friends" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer">
              <RadioGroupItem id="aud-friends" value="friends" />
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">Friends only</span>
            </label>
            <label htmlFor="aud-community" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary/60 cursor-pointer">
              <RadioGroupItem id="aud-community" value="community" />
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">Wider community</span>
            </label>
          </RadioGroup>
          {audience === "friends" && friendIds.size === 0 && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              No friends yet — <Link to="/friends" className="underline hover:text-foreground">add some</Link>.
            </p>
          )}
        </div>
      )}

      {(mode !== "all" || distanceFilter !== "all" || audience !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMode("all");
            setDistanceFilter("all");
            setAudience("all");
          }}
          className="w-full gap-2"
        >
          <X className="w-3.5 h-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <section id="marketplace" className="border-b border-border/60 bg-secondary/20 scroll-mt-20">
      <div className="container mx-auto px-6 py-12 md:py-16">
        {/* Top bar: search + mobile filter trigger + sort note */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items (camera, bike, projector…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-background"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden gap-2 rounded-full">
                <Filter className="w-4 h-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FiltersPanel />
            </SheetContent>
          </Sheet>
          {location && (
            <div className="hidden md:flex text-xs uppercase tracking-[0.2em] text-muted-foreground items-center gap-2">
              <Navigation className="w-3 h-3" />
              Sorted by distance
            </div>
          )}
        </div>

        {!authed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Lock className="w-3 h-3" />
            <span>
              Browse freely.{" "}
              <Link to="/auth" className="underline hover:text-foreground">Sign in</Link>{" "}
              to borrow, buy, or message owners.
            </span>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="sticky top-24 bg-background border border-border/60 rounded-lg p-5">
              <FiltersPanel />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
                {mode === "borrow" && " to borrow"}
                {mode === "buy" && " to buy"}
              </h2>
            </div>
            {renderGrid(filtered)}
          </div>
        </div>
      </div>

      <BorrowRequestDialog
        item={borrowItem ? { id: borrowItem.id, name: borrowItem.name, user_id: borrowItem.user_id, sharing_price: borrowItem.sharing_price } : null}
        open={!!borrowItem}
        onOpenChange={(o) => !o && setBorrowItem(null)}
      />
    </section>
  );
}
