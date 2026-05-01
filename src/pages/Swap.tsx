import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Check, X, Reply, Loader2, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type SwapItem = {
  id: string;
  name: string;
  brand: string | null;
  image_urls: string[] | null;
  user_id: string;
  is_available_for_sharing: boolean;
};

type SwapOffer = {
  id: string;
  offerer_id: string;
  recipient_id: string;
  offered_item_id: string;
  requested_item_id: string;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled" | "countered";
  counter_of_id: string | null;
  created_at: string;
};

const ItemThumb = ({ item }: { item: SwapItem | undefined }) => {
  if (!item) return <div className="w-full aspect-square bg-muted rounded-md" />;
  const img = item.image_urls?.[0];
  return (
    <div className="w-full aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
      {img ? (
        <img src={img} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs text-muted-foreground p-2 text-center">{item.name}</span>
      )}
    </div>
  );
};

const Swap = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [browseItems, setBrowseItems] = useState<SwapItem[]>([]);
  const [myItems, setMyItems] = useState<SwapItem[]>([]);
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [itemsById, setItemsById] = useState<Record<string, SwapItem>>({});

  // Propose dialog state
  const [proposeFor, setProposeFor] = useState<SwapItem | null>(null);
  const [pickedOfferedId, setPickedOfferedId] = useState<string | null>(null);
  const [proposeMessage, setProposeMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Counter dialog state
  const [counterFor, setCounterFor] = useState<SwapOffer | null>(null);
  const [counterPickedId, setCounterPickedId] = useState<string | null>(null);
  const [counterMessage, setCounterMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (uid: string | null) => {
    setLoading(true);

    // Browse: items shared by other people
    const { data: browse } = await supabase
      .from("inventory_items")
      .select("id,name,brand,image_urls,user_id,is_available_for_sharing")
      .eq("is_available_for_sharing", true)
      .neq("user_id", uid ?? "00000000-0000-0000-0000-000000000000")
      .limit(60);

    // My items (for offering)
    let mine: SwapItem[] = [];
    if (uid) {
      const { data } = await supabase
        .from("inventory_items")
        .select("id,name,brand,image_urls,user_id,is_available_for_sharing")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      mine = (data as SwapItem[]) ?? [];
    }

    // Offers
    let offerRows: SwapOffer[] = [];
    if (uid) {
      const { data } = await supabase
        .from("swap_offers")
        .select("*")
        .or(`offerer_id.eq.${uid},recipient_id.eq.${uid}`)
        .order("created_at", { ascending: false });
      offerRows = (data as SwapOffer[]) ?? [];
    }

    // Fetch any items referenced in offers that we don't already have
    const referencedIds = new Set<string>();
    offerRows.forEach((o) => {
      referencedIds.add(o.offered_item_id);
      referencedIds.add(o.requested_item_id);
    });
    const known = new Set<string>([
      ...(browse ?? []).map((b: any) => b.id),
      ...mine.map((m) => m.id),
    ]);
    const missing = Array.from(referencedIds).filter((id) => !known.has(id));
    let extra: SwapItem[] = [];
    if (missing.length) {
      const { data } = await supabase
        .from("inventory_items")
        .select("id,name,brand,image_urls,user_id,is_available_for_sharing")
        .in("id", missing);
      extra = (data as SwapItem[]) ?? [];
    }

    const map: Record<string, SwapItem> = {};
    [...(browse ?? []), ...mine, ...extra].forEach((it: any) => (map[it.id] = it));
    setItemsById(map);
    setBrowseItems((browse as SwapItem[]) ?? []);
    setMyItems(mine);
    setOffers(offerRows);
    setLoading(false);
  };

  useEffect(() => {
    loadData(user?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const incoming = useMemo(
    () => offers.filter((o) => o.recipient_id === user?.id),
    [offers, user?.id]
  );
  const outgoing = useMemo(
    () => offers.filter((o) => o.offerer_id === user?.id),
    [offers, user?.id]
  );

  const submitOffer = async () => {
    if (!user || !proposeFor || !pickedOfferedId) return;
    setSubmitting(true);
    const { error } = await supabase.from("swap_offers").insert({
      offerer_id: user.id,
      recipient_id: proposeFor.user_id,
      offered_item_id: pickedOfferedId,
      requested_item_id: proposeFor.id,
      message: proposeMessage.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Notify recipient
    await supabase.from("notifications").insert({
      sender_id: user.id,
      recipient_id: proposeFor.user_id,
      item_id: proposeFor.id,
      message: `New swap offer for your "${proposeFor.name}"`,
    });
    toast.success("Swap offer sent");
    setProposeFor(null);
    setPickedOfferedId(null);
    setProposeMessage("");
    loadData(user.id);
  };

  const respond = async (offer: SwapOffer, status: "accepted" | "declined") => {
    const { error } = await supabase
      .from("swap_offers")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", offer.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("notifications").insert({
      sender_id: user!.id,
      recipient_id: offer.offerer_id,
      item_id: offer.offered_item_id,
      message: `Your swap offer was ${status}`,
    });
    toast.success(`Offer ${status}`);
    loadData(user!.id);
  };

  const cancel = async (offer: SwapOffer) => {
    const { error } = await supabase
      .from("swap_offers")
      .update({ status: "cancelled" })
      .eq("id", offer.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Offer cancelled");
    loadData(user!.id);
  };

  const submitCounter = async () => {
    if (!user || !counterFor || !counterPickedId) return;
    setSubmitting(true);
    // Mark original as countered
    await supabase
      .from("swap_offers")
      .update({ status: "countered", responded_at: new Date().toISOString() })
      .eq("id", counterFor.id);
    // Insert reverse offer (recipient becomes offerer)
    const { error } = await supabase.from("swap_offers").insert({
      offerer_id: user.id,
      recipient_id: counterFor.offerer_id,
      offered_item_id: counterFor.requested_item_id, // they want what was originally requested? No: counter offers a different item of mine
      requested_item_id: counterPickedId, // they request this item from original offerer
      message: counterMessage.trim() || null,
      counter_of_id: counterFor.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("notifications").insert({
      sender_id: user.id,
      recipient_id: counterFor.offerer_id,
      item_id: counterPickedId,
      message: "You have a counter-offer on a swap",
    });
    toast.success("Counter-offer sent");
    setCounterFor(null);
    setCounterPickedId(null);
    setCounterMessage("");
    loadData(user.id);
  };

  const StatusBadge = ({ s }: { s: SwapOffer["status"] }) => {
    const map: Record<SwapOffer["status"], string> = {
      pending: "bg-amber-100 text-amber-900",
      accepted: "bg-green-100 text-green-900",
      declined: "bg-rose-100 text-rose-900",
      cancelled: "bg-muted text-muted-foreground",
      countered: "bg-blue-100 text-blue-900",
    };
    return <Badge className={`${map[s]} border-0 capitalize`}>{s}</Badge>;
  };

  const OfferCard = ({ o, role }: { o: SwapOffer; role: "incoming" | "outgoing" }) => {
    const offered = itemsById[o.offered_item_id];
    const requested = itemsById[o.requested_item_id];
    return (
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {new Date(o.created_at).toLocaleDateString()}
              {o.counter_of_id && <span className="ml-2 italic">counter-offer</span>}
            </div>
            <StatusBadge s={o.status} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {role === "incoming" ? "They offer" : "You offer"}
              </div>
              <ItemThumb item={offered} />
              <div className="text-sm font-medium truncate">{offered?.name ?? "Item"}</div>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {role === "incoming" ? "For your" : "For their"}
              </div>
              <ItemThumb item={requested} />
              <div className="text-sm font-medium truncate">{requested?.name ?? "Item"}</div>
            </div>
          </div>
          {o.message && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
              "{o.message}"
            </p>
          )}
          {o.status === "pending" && role === "incoming" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => respond(o, "accepted")}>
                <Check className="w-4 h-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => respond(o, "declined")}>
                <X className="w-4 h-4 mr-1" /> Decline
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCounterFor(o)}>
                <Reply className="w-4 h-4 mr-1" /> Counter
              </Button>
            </div>
          )}
          {o.status === "pending" && role === "outgoing" && (
            <Button size="sm" variant="outline" onClick={() => cancel(o)}>
              Cancel offer
            </Button>
          )}
          {o.status === "accepted" && (
            <p className="text-xs text-muted-foreground">
              Coordinate handoff via{" "}
              <Link to="/messages" className="underline">messages</Link>.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Beta
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Swap Market
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Trade an item of yours for one you'd rather have. Pick something from your neighbor's
            shelf, offer one of your own, and see if they bite.
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="incoming">
              Incoming{incoming.filter((o) => o.status === "pending").length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {incoming.filter((o) => o.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {!user && (
              <Card className="mb-4">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  <Link to="/auth" className="underline">Sign in</Link> to propose swaps.
                </CardContent>
              </Card>
            )}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : browseItems.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                No swappable items in the community yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {browseItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-border/60">
                    <ItemThumb item={item} />
                    <CardContent className="p-3 space-y-2">
                      <div>
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        {item.brand && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.brand}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!user || myItems.length === 0}
                        onClick={() => {
                          setProposeFor(item);
                          setPickedOfferedId(null);
                          setProposeMessage("");
                        }}
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-1" />
                        Propose swap
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-6">
            {incoming.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">No incoming offers.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {incoming.map((o) => (
                  <OfferCard key={o.id} o={o} role="incoming" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            {outgoing.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">No outgoing offers yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {outgoing.map((o) => (
                  <OfferCard key={o.id} o={o} role="outgoing" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Propose dialog */}
      <Dialog open={!!proposeFor} onOpenChange={(open) => !open && setProposeFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Propose a swap</DialogTitle>
            <DialogDescription>
              You want <strong>{proposeFor?.name}</strong>. Pick one of your items to offer in
              exchange.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {myItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don't have any items yet.{" "}
                <Link to="/dashboard/add-item" className="underline">Add one</Link>.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {myItems.map((mi) => (
                  <button
                    key={mi.id}
                    onClick={() => setPickedOfferedId(mi.id)}
                    className={`text-left rounded-md border-2 p-1.5 transition-colors ${
                      pickedOfferedId === mi.id
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <ItemThumb item={mi} />
                    <div className="text-xs mt-1 truncate">{mi.name}</div>
                  </button>
                ))}
              </div>
            )}
            <Textarea
              placeholder="Add a note (optional)"
              value={proposeMessage}
              onChange={(e) => setProposeMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeFor(null)}>Cancel</Button>
            <Button onClick={submitOffer} disabled={!pickedOfferedId || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter dialog */}
      <Dialog open={!!counterFor} onOpenChange={(open) => !open && setCounterFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Counter with a different item</DialogTitle>
            <DialogDescription>
              Pick one of <strong>their</strong> items you'd accept instead.
            </DialogDescription>
          </DialogHeader>
          <CounterPicker
            ownerId={counterFor?.offerer_id}
            pickedId={counterPickedId}
            onPick={setCounterPickedId}
          />
          <Textarea
            placeholder="Add a note (optional)"
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterFor(null)}>Cancel</Button>
            <Button onClick={submitCounter} disabled={!counterPickedId || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send counter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CounterPicker = ({
  ownerId,
  pickedId,
  onPick,
}: {
  ownerId?: string;
  pickedId: string | null;
  onPick: (id: string) => void;
}) => {
  const [items, setItems] = useState<SwapItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerId) return;
    setLoading(true);
    supabase
      .from("inventory_items")
      .select("id,name,brand,image_urls,user_id,is_available_for_sharing")
      .eq("user_id", ownerId)
      .eq("is_available_for_sharing", true)
      .then(({ data }) => {
        setItems((data as SwapItem[]) ?? []);
        setLoading(false);
      });
  }, [ownerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">They have no other shared items.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          className={`text-left rounded-md border-2 p-1.5 transition-colors ${
            pickedId === it.id ? "border-primary" : "border-transparent hover:border-border"
          }`}
        >
          <ItemThumb item={it} />
          <div className="text-xs mt-1 truncate">{it.name}</div>
        </button>
      ))}
    </div>
  );
};

export default Swap;
