import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, HandHeart, ShoppingCart, MessageCircle, Search, Navigation, Lock } from "lucide-react";
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
  owner: OwnerProfile | null;
  distance: number | null;
}

const PAGE_SIZE = 24;

export function CommunityMarketplace() {
  const navigate = useNavigate();
  const { location, loading: locLoading, denied, requestBrowserLocation } = useViewerLocation();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<string>("all");
  const [borrowItem, setBorrowItem] = useState<MarketItem | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("inventory_items")
        .select("id, user_id, name, description, image_urls, condition, sharing_price")
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

      // Sort: items with distance first (nearest), then the rest
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
    return items.filter((it) => {
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
  }, [items, search, distanceFilter, location]);

  const borrowItems = filtered.filter((it) => !it.sharing_price || it.sharing_price === 0 || (it.sharing_price && it.sharing_price > 0 && it.sharing_price <= 0));
  // Treat sharing_price null/0 → free borrow; >0 → both borrow (paid) and buy unclear.
  // Simpler split: borrow = price null OR 0, buy = price > 0.
  const borrowList = filtered.filter((it) => !it.sharing_price || Number(it.sharing_price) === 0);
  const buyList = filtered.filter((it) => it.sharing_price != null && Number(it.sharing_price) > 0);

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
    const isFree = !item.sharing_price || Number(item.sharing_price) === 0;
    const ownerName = item.owner?.public_display_name || item.owner?.full_name || "Member";
    const ownerAvatar = item.owner?.public_avatar_url || item.owner?.avatar_url || undefined;
    const cover = item.image_urls?.[0];

    return (
      <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] relative bg-secondary/40 overflow-hidden">
          {cover ? (
            <img src={cover} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
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
          {isFree && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              Free to borrow
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {item.condition && <Badge variant="outline" className="capitalize">{item.condition}</Badge>}
            {!isFree && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                ${Number(item.sharing_price).toFixed(2)}
              </Badge>
            )}
          </div>

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
                onClick={() => handleMessage(item)}
                title="Message owner"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              {isFree ? (
                <Button size="sm" onClick={() => handleBorrow(item)}>
                  <HandHeart className="w-4 h-4 mr-1" /> Borrow
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleBuy(item)}>
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
      return (
        <div className="text-center py-16 text-muted-foreground">
          <p>No items match your filters yet.</p>
          <p className="text-sm mt-1">Be the first to share — your community starts with you.</p>
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

  return (
    <section className="border-b border-border/60 bg-secondary/20">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              § Available now in your community
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-light max-w-2xl">
              Borrow what you need.<br />
              <span className="italic font-display-wonk text-primary">Buy from neighbors.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg">
              Real items shared by real people nearby. Stop buying what already exists on your street.
            </p>
          </div>

          {!location && !locLoading && (
            <Button variant="outline" onClick={requestBrowserLocation} className="rounded-full gap-2 self-start">
              <Navigation className="w-4 h-4" />
              {denied ? "Location blocked" : "Use my location"}
            </Button>
          )}
          {location && (
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 self-start md:self-end">
              <Navigation className="w-3 h-3" />
              Sorted by distance
            </div>
          )}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items (drill, camera, bike…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-background"
            />
          </div>
          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-background">
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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            <TabsTrigger value="borrow" className="gap-1">
              <HandHeart className="w-3.5 h-3.5" /> Borrow ({borrowList.length})
            </TabsTrigger>
            <TabsTrigger value="buy" className="gap-1">
              <ShoppingCart className="w-3.5 h-3.5" /> Buy ({buyList.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderGrid(filtered)}</TabsContent>
          <TabsContent value="borrow">{renderGrid(borrowList)}</TabsContent>
          <TabsContent value="buy">{renderGrid(buyList)}</TabsContent>
        </Tabs>
      </div>

      <BorrowRequestDialog
        item={borrowItem ? { id: borrowItem.id, name: borrowItem.name, user_id: borrowItem.user_id, sharing_price: borrowItem.sharing_price } : null}
        open={!!borrowItem}
        onOpenChange={(o) => !o && setBorrowItem(null)}
      />
    </section>
  );
}
