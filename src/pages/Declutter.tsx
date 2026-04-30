import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Heart,
  Gift,
  DollarSign,
  Sparkles,
  ImageIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { QuirkyLoader } from "@/components/QuirkyLoader";
import { useDemo } from "@/contexts/DemoContext";

interface Item {
  id: string;
  name: string;
  brand: string | null;
  location: string | null;
  original_price: number | null;
  quantity: number;
  usage_frequency: string | null;
  condition: string | null;
  image_urls: string[] | null;
  created_at: string | null;
  category_name: string | null;
}

type Decision = "keep" | "donate" | "sell";

interface ReviewedItem {
  item: Item;
  decision: Decision;
}

const RARELY_USED = new Set(["rarely", "never", "Rarely", "Never"]);

// Higher score = review sooner.
const priorityScore = (it: Item): number => {
  let score = 0;
  if (it.usage_frequency && RARELY_USED.has(it.usage_frequency)) score += 100;
  // High value items
  const value = (it.original_price ?? 0) * (it.quantity ?? 1);
  if (value >= 100) score += 50;
  if (value >= 500) score += 50;
  // Older items first
  if (it.created_at) {
    const ageDays =
      (Date.now() - new Date(it.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 365) score += 30;
    else if (ageDays > 180) score += 15;
  }
  return score;
};

const Declutter = () => {
  const navigate = useNavigate();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Item[]>([]);
  const [reviewed, setReviewed] = useState<ReviewedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [isDemoMode]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let items: Item[] = [];
      if (isDemoMode) {
        const catMap = new Map(
          demoCategories.map((c: any) => [c.id, c.name])
        );
        items = demoItems.map((it: any) => ({
          id: it.id,
          name: it.name,
          brand: it.brand ?? null,
          location: it.location ?? null,
          original_price: it.original_price ?? null,
          quantity: it.quantity ?? 1,
          usage_frequency: it.usage_frequency ?? null,
          condition: it.condition ?? null,
          image_urls: it.image_urls ?? null,
          created_at: it.created_at ?? null,
          category_name: catMap.get(it.category_id) ?? null,
        }));
      } else {
        const [{ data: rawItems }, { data: cats }] = await Promise.all([
          supabase
            .from("inventory_items")
            .select(
              "id, name, brand, location, original_price, quantity, usage_frequency, condition, image_urls, created_at, category_id, is_donated, is_sold, is_eliminated"
            )
            .eq("is_donated", false)
            .eq("is_sold", false)
            .eq("is_eliminated", false),
          supabase.from("categories").select("id, name"),
        ]);
        const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
        items = (rawItems ?? []).map((it: any) => ({
          id: it.id,
          name: it.name,
          brand: it.brand,
          location: it.location,
          original_price: it.original_price,
          quantity: it.quantity ?? 1,
          usage_frequency: it.usage_frequency,
          condition: it.condition,
          image_urls: it.image_urls,
          created_at: it.created_at,
          category_name: it.category_id ? catMap.get(it.category_id) ?? null : null,
        }));
      }

      // Sort by priority desc
      items.sort((a, b) => priorityScore(b) - priorityScore(a));
      setQueue(items);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load items");
    } finally {
      setLoading(false);
    }
  };

  const current = queue[0];
  const total = queue.length + reviewed.length;
  const progress = total > 0 ? (reviewed.length / total) * 100 : 0;

  const stats = useMemo(() => {
    const keep = reviewed.filter((r) => r.decision === "keep").length;
    const donate = reviewed.filter((r) => r.decision === "donate").length;
    const sell = reviewed.filter((r) => r.decision === "sell").length;
    const sellValue = reviewed
      .filter((r) => r.decision === "sell")
      .reduce(
        (s, r) =>
          s + (r.item.original_price ?? 0) * (r.item.quantity ?? 1),
        0
      );
    return { keep, donate, sell, sellValue };
  }, [reviewed]);

  const recordDecision = (decision: Decision) => {
    if (!current) return;
    setReviewed((prev) => [...prev, { item: current, decision }]);
    setQueue((prev) => prev.slice(1));
  };

  const undo = () => {
    if (reviewed.length === 0) return;
    const last = reviewed[reviewed.length - 1];
    setReviewed((prev) => prev.slice(0, -1));
    setQueue((prev) => [last.item, ...prev]);
  };

  const finishSession = async () => {
    if (reviewed.length === 0) {
      navigate("/dashboard?tab=inventory");
      return;
    }
    if (isDemoMode) {
      toast.info("Demo mode — decisions weren't saved");
      navigate("/dashboard?tab=inventory");
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Apply only donate/sell decisions (keep is a no-op).
      const donates = reviewed.filter((r) => r.decision === "donate");
      const sells = reviewed.filter((r) => r.decision === "sell");

      const ops: any[] = [];
      for (const r of donates) {
        ops.push(
          supabase
            .from("inventory_items")
            .update({ is_donated: true, donated_date: today })
            .eq("id", r.item.id)
        );
      }
      for (const r of sells) {
        ops.push(
          supabase
            .from("inventory_items")
            .update({ is_sold: true, sold_date: today })
            .eq("id", r.item.id)
        );
      }
      const results = await Promise.all(ops);
      const failed = results.filter((r) => r.error).length;
      if (failed > 0) {
        toast.error(`${failed} item${failed === 1 ? "" : "s"} couldn't be updated`);
      } else {
        const moved = donates.length + sells.length;
        if (moved > 0) {
          toast.success(`Decluttered ${moved} item${moved === 1 ? "" : "s"}!`);
        } else {
          toast.success("Session saved");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't finish session");
    } finally {
      setSubmitting(false);
      navigate("/dashboard?tab=inventory");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <QuirkyLoader size="lg" />
      </div>
    );
  }

  // No items at all
  if (queue.length === 0 && reviewed.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <Sparkles className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-semibold">Nothing to declutter yet</h1>
          <p className="text-muted-foreground">
            Add some items to your inventory first, then come back to sort through them.
          </p>
          <Button onClick={() => navigate("/dashboard?tab=inventory")}>
            Back to inventory
          </Button>
        </div>
      </div>
    );
  }

  // Session complete
  if (queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-lg w-full p-8 space-y-6 text-center">
          <div className="space-y-2">
            <Sparkles className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-semibold">Session complete</h1>
            <p className="text-muted-foreground">
              You reviewed {reviewed.length} item{reviewed.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg border bg-muted/40">
              <div className="text-2xl font-semibold">{stats.keep}</div>
              <div className="text-muted-foreground">Kept</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <div className="text-2xl font-semibold">{stats.donate}</div>
              <div className="text-muted-foreground">Donate</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <div className="text-2xl font-semibold">{stats.sell}</div>
              <div className="text-muted-foreground">Sell</div>
            </div>
          </div>

          {stats.sellValue > 0 && (
            <p className="text-sm text-muted-foreground">
              Potential resale value:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(stats.sellValue)}
              </span>
            </p>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard?tab=inventory")}>
              Skip
            </Button>
            <Button onClick={finishSession} disabled={submitting}>
              {submitting ? "Saving…" : "Save decisions"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Active session — current item card
  const itemValue =
    current.original_price != null
      ? current.original_price * (current.quantity ?? 1)
      : null;
  const photo = current.image_urls && current.image_urls.length > 0 ? current.image_urls[0] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard?tab=inventory")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
          <div className="flex-1 max-w-md flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {reviewed.length} / {total}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">{stats.keep}</span> kept</span>
            <span><span className="font-semibold text-foreground">{stats.donate}</span> donate</span>
            <span><span className="font-semibold text-foreground">{stats.sell}</span> sell</span>
          </div>
        </div>
      </header>

      {/* Item card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-2xl overflow-hidden shadow-lg">
          <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
            {photo ? (
              <img
                src={photo}
                alt={current.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-12 h-12" />
                <span className="text-sm">No photo</span>
              </div>
            )}
            {current.usage_frequency && RARELY_USED.has(current.usage_frequency) && (
              <Badge className="absolute top-3 left-3 bg-amber-500/90 hover:bg-amber-500 text-white">
                Rarely used
              </Badge>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold leading-tight">{current.name}</h2>
              {(current.brand || current.category_name) && (
                <p className="text-sm text-muted-foreground">
                  {[current.brand, current.category_name].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {itemValue != null && (
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(itemValue)}
                </Badge>
              )}
              {current.location && (
                <Badge variant="outline">{current.location}</Badge>
              )}
              {current.condition && (
                <Badge variant="outline" className="capitalize">
                  {current.condition}
                </Badge>
              )}
              {current.quantity > 1 && (
                <Badge variant="outline">Qty {current.quantity}</Badge>
              )}
            </div>

            {/* Decision buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-1 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950"
                onClick={() => recordDecision("keep")}
              >
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">Keep</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950"
                onClick={() => recordDecision("donate")}
              >
                <Gift className="w-5 h-5" />
                <span className="text-sm font-medium">Donate</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-1 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 dark:hover:bg-amber-950"
                onClick={() => recordDecision("sell")}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Sell</span>
              </Button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={reviewed.length === 0}
                className="gap-1.5 text-muted-foreground"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={finishSession}
                className="text-muted-foreground"
              >
                Finish session
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Declutter;
