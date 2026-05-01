import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, HandHeart, ShoppingCart, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BorrowRequestDialog } from "@/components/friends/BorrowRequestDialog";

interface OwnerProfile {
  id: string;
  city: string | null;
  public_display_name: string | null;
  full_name: string | null;
  public_avatar_url: string | null;
  avatar_url: string | null;
}

interface Item {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_urls: string[] | null;
  condition: string | null;
  sharing_price: number | null;
  brand: string | null;
  tags: string[] | null;
  category_id: string | null;
  owner: OwnerProfile | null;
}

const SIMILAR_LIMIT = 4;

export default function MarketplaceItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [borrowOpen, setBorrowOpen] = useState(false);

  const [similar, setSimilar] = useState<Item[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setActiveImage(0);
    setSimilar([]);

    (async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(
          "id, user_id, name, description, image_urls, condition, sharing_price, brand, tags, category_id"
        )
        .eq("id", id)
        .eq("is_available_for_sharing", true)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setItem(null);
        setLoading(false);
        return;
      }

      // Fetch owner profile separately
      const { data: ownerRow } = await supabase
        .from("profiles")
        .select("id, city, public_display_name, full_name, public_avatar_url, avatar_url")
        .eq("id", data.user_id)
        .maybeSingle();

      if (cancelled) return;
      setItem({ ...(data as any), owner: (ownerRow as any) ?? null });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch similar items via AI edge function
  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    setSimilarLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("find-similar-items", {
          body: null,
          method: "GET" as any,
        }).catch(() => ({ data: null, error: "invoke-failed" } as any));

        // supabase.functions.invoke doesn't pass query params well — fall back to fetch.
        let ids: string[] = [];
        if (data && Array.isArray((data as any).ids)) {
          ids = (data as any).ids;
        } else {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-similar-items?itemId=${item.id}&limit=${SIMILAR_LIMIT}`;
          const resp = await fetch(url, {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          });
          if (resp.ok) {
            const json = await resp.json();
            ids = Array.isArray(json.ids) ? json.ids : [];
          }
        }

        if (cancelled || ids.length === 0) {
          setSimilarLoading(false);
          return;
        }

        const { data: rows } = await supabase
          .from("inventory_items")
          .select(
            "id, user_id, name, description, image_urls, condition, sharing_price, brand, tags, category_id"
          )
          .in("id", ids)
          .eq("is_available_for_sharing", true);

        if (cancelled) return;

        const ownerIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
        const { data: owners } = ownerIds.length
          ? await supabase
              .from("profiles")
              .select("id, city, public_display_name, full_name, public_avatar_url, avatar_url")
              .in("id", ownerIds)
          : { data: [] as any[] };

        const ownerMap = new Map((owners || []).map((o: any) => [o.id, o]));
        const ordered = ids
          .map((rid) => (rows || []).find((r: any) => r.id === rid))
          .filter(Boolean)
          .map((r: any) => ({ ...r, owner: ownerMap.get(r.user_id) ?? null }));

        if (!cancelled) setSimilar(ordered as Item[]);
      } catch (e) {
        console.error("similar items error", e);
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  const requireAuth = (action: string) => {
    toast.info(`Sign in to ${action}`);
    navigate("/auth");
  };

  const handleMessage = async (target: Item, prefill?: string) => {
    if (!authed) return requireAuth("message the owner");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return requireAuth("message the owner");
    if (user.id === target.user_id) {
      toast.info("This is your own item");
      return;
    }
    try {
      const { data: convo, error: convErr } = await supabase
        .from("conversations")
        .insert({ item_id: target.id })
        .select()
        .single();
      if (convErr || !convo) throw convErr;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user.id },
        { conversation_id: convo.id, user_id: target.user_id },
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <h1 className="text-2xl font-semibold mb-2">Item not available</h1>
        <p className="text-muted-foreground mb-6">
          This item isn't being shared right now.
        </p>
        <Button onClick={() => navigate("/")}>Back to marketplace</Button>
      </div>
    );
  }

  const isFree = !item.sharing_price || Number(item.sharing_price) === 0;
  const ownerName =
    item.owner?.public_display_name || item.owner?.full_name || "Member";
  const ownerAvatar =
    item.owner?.public_avatar_url || item.owner?.avatar_url || undefined;
  const cover = item.image_urls?.[activeImage] ?? item.image_urls?.[0];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-lg bg-secondary/40 overflow-hidden">
            {cover ? (
              <img
                src={cover}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No photo
              </div>
            )}
          </div>
          {item.image_urls && item.image_urls.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {item.image_urls.slice(0, 5).map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-md overflow-hidden border-2 ${
                    i === activeImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              {item.name}
            </h1>
            {item.brand && (
              <p className="text-sm text-muted-foreground mt-1">{item.brand}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            {isFree ? (
              <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                Free to borrow
              </Badge>
            ) : (
              <span className="text-3xl font-semibold">
                ${Number(item.sharing_price).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {item.condition && (
              <Badge variant="outline" className="capitalize">
                {item.condition}
              </Badge>
            )}
            {(item.tags || []).slice(0, 6).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>

          {item.description && (
            <p className="text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          )}

          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <Link
                to={`/profile/${item.user_id}`}
                className="flex items-center gap-3 min-w-0 hover:opacity-80"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={ownerAvatar} />
                  <AvatarFallback>{ownerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{ownerName}</div>
                  {item.owner?.city && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.owner.city}
                    </div>
                  )}
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMessage(item)}
              >
                <MessageCircle className="w-4 h-4 mr-1" /> Message
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {isFree ? (
              <Button
                size="lg"
                className="flex-1"
                onClick={() =>
                  authed ? setBorrowOpen(true) : requireAuth("borrow this item")
                }
              >
                <HandHeart className="w-5 h-5 mr-2" /> Request to borrow
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1"
                onClick={() =>
                  handleMessage(
                    item,
                    `Hi! I'm interested in buying your ${item.name}.`
                  )
                }
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Buy
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Similar items */}
      <section className="mt-12 pt-8 border-t">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Similar items</h2>
        </div>

        {similarLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: SIMILAR_LIMIT }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : similar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No similar items right now — check back soon.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map((s) => {
              const sFree =
                !s.sharing_price || Number(s.sharing_price) === 0;
              const sCover = s.image_urls?.[0];
              const sOwner =
                s.owner?.public_display_name ||
                s.owner?.full_name ||
                "Member";
              return (
                <Link
                  key={s.id}
                  to={`/marketplace/item/${s.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border/60 group-hover:shadow-md transition-shadow h-full">
                    <div className="aspect-[4/3] bg-secondary/40 overflow-hidden">
                      {sCover ? (
                        <img
                          src={sCover}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No photo
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-medium text-sm truncate">{s.name}</h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {sOwner}
                        </span>
                        {sFree ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-xs"
                          >
                            Free
                          </Badge>
                        ) : (
                          <span className="text-sm font-semibold">
                            ${Number(s.sharing_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <BorrowRequestDialog
        item={item}
        open={borrowOpen}
        onOpenChange={setBorrowOpen}
      />
    </div>
  );
}
