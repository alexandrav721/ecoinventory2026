/**
 * OpportunitiesPanel — "what could you do with this stuff?", on /dashboard.
 *
 * TWO THINGS WERE WRONG HERE, AND BOTH WERE DOLLAR FIGURES OR COUNTS
 * SOMEONE WOULD BELIEVE.
 *
 * 1. THE RESALE ESTIMATE WAS A FLAT 60% OF WHAT YOU PAID.
 *    The app estimates the same number with three multipliers — condition,
 *    category and age (src/lib/valuation.ts). On a six-year-old laptop
 *    bought for $2,000 the app says $144 and this panel said $1,200. Same
 *    row, same database, 8x apart, and the bigger number was the one shown
 *    next to a "View items" button. It now calls the app's model, so the
 *    phone and the web quote the same price.
 *
 * 2. DEMO MODE WAS FOUR HARDCODED CARDS, ONE OF WHICH WAS ABOUT AN ITEM
 *    THE DEMO HOUSEHOLD DOES NOT OWN. It announced "Excess: 12 coffee
 *    cups"; the demo inventory is a laptop, headphones, a jacket, a mixer,
 *    a bike, a tent, a shelf, a drill, a record collection, running shoes,
 *    a skillet and a denim jacket. No cups. A visitor clicking around
 *    before signing up was being shown an invented finding about invented
 *    stuff, on the first screen, which is the screen that has to be true.
 *
 *    Demo mode now runs the real analysis over the real demo inventory.
 *    Same function, same thresholds, same valuation as a signed-in
 *    account — only the rows differ. If it finds nothing, it says so,
 *    which is a better demo than a fake finding.
 *
 * The excess check still only runs for signed-in accounts: it reads
 * household benchmarks and WRITES insight rows server-side, and a demo
 * that nothing saves must not write. That is a stated gap, not a silent
 * one — the empty state is honest about having looked.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, AlertTriangle, Sparkles, Gift,
  Lightbulb, RefreshCw, Copy, ChevronRight,
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { analyzeInventoryForExcess, createExcessInsights } from "@/lib/excessDetection";
import { estimateWorthToday } from "@/lib/valuation";
import { groupDuplicates } from "@/lib/realInsights";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  type: "sell" | "donate" | "declutter" | "share";
  title: string;
  description: string;
  potentialValue?: number;
  itemCount: number;
  icon: any;
  color: "emerald" | "pink" | "amber" | "orange" | "blue";
  action: string;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
};

/* ─── The analysis, as a pure function ──────────────────────────────────
   Taking (items, categories) rather than a user id is the whole point: the
   demo household and a real account go through this same code, so a demo
   can no longer claim something the analysis would never have said. */

type AnalysisItem = {
  name?: string | null;
  original_price?: number | string | null;
  condition?: string | null;
  category_id?: string | null;
  purchase_date?: string | null;
  usage_frequency?: string | null;
};

type AnalysisCategory = { id: string; name: string };

const MONTH_MS = 1000 * 60 * 60 * 24 * 30;

function monthsSince(date: string | null | undefined, now: number): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return (now - t) / MONTH_MS;
}

function findOpportunities(
  items: AnalysisItem[],
  categories: AnalysisCategory[]
): Opportunity[] {
  const out: Opportunity[] = [];
  const now = Date.now();

  /* Sellable: owned a while, barely used, and worth more than pocket
     change. An item with no purchase_date is NOT assumed old — that is the
     same "blank means today" guess that was corrupting purchase dates on
     the add form. No date, no claim about age. */
  const sellable = items.filter((item) => {
    const months = monthsSince(item.purchase_date, now);
    if (months === null || months < 6) return false;
    if (item.usage_frequency !== "rarely") return false;
    return Number(item.original_price ?? 0) > 20;
  });

  if (sellable.length > 0) {
    /* The app's model, not a flat percentage. Items it cannot price
       (no original_price) contribute null and are skipped, so the total
       is "across the ones we could price" rather than a padded zero. */
    const priced = sellable
      .map((item) => estimateWorthToday(item, categories))
      .filter((v): v is number => typeof v === "number" && v > 0);
    const potentialValue = priced.reduce((sum, v) => sum + v, 0);

    if (potentialValue > 0) {
      out.push({
        id: "sell",
        type: "sell",
        title: `${sellable.length} ${sellable.length === 1 ? "thing" : "things"} could sell for about ${formatCurrency(potentialValue)}`,
        description:
          priced.length === sellable.length
            ? "Barely used, and still worth something"
            : `Barely used · estimated across the ${priced.length} we could price`,
        potentialValue,
        itemCount: sellable.length,
        icon: DollarSign,
        color: "emerald",
        action: "View items",
      });
    }
  }

  const donatable = items.filter((item) => {
    const months = monthsSince(item.purchase_date, now);
    if (months === null || months < 12) return false;
    if (item.condition === "poor") return false;
    return Number(item.original_price ?? 0) < 50;
  });
  if (donatable.length >= 2) {
    out.push({
      id: "donate",
      type: "donate",
      title: `${donatable.length} things someone else could use`,
      description: "Had them a year, still in good shape",
      itemCount: donatable.length,
      icon: Gift,
      color: "pink",
      action: "Review",
    });
  }

  /* Duplicates from the same pure grouper /insights uses, so the two
     screens count the same piles. */
  const piles = groupDuplicates(items);
  if (piles.length > 0) {
    out.push({
      id: "duplicates",
      type: "declutter",
      title: `${piles.length} ${piles.length === 1 ? "thing" : "things"} you have more than one of`,
      description: piles
        .slice(0, 3)
        .map((pile) => `${pile.count} x ${pile.label}`)
        .join(" · "),
      itemCount: piles.reduce((sum, pile) => sum + pile.count, 0),
      icon: Copy,
      color: "amber",
      action: "Analyze",
    });
  }

  return out;
}

export const OpportunitiesPanel = () => {
  const navigate = useNavigate();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (!isDemoMode) return;
    /* The real analysis over the real demo inventory. Whatever it finds is
       what a visitor sees; if it finds nothing, the empty state says so. */
    setOpportunities(
      findOpportunities(
        demoItems as AnalysisItem[],
        demoCategories as AnalysisCategory[]
      )
    );
    setHasAnalyzed(true);
  }, [isDemoMode, demoItems, demoCategories]);

  const handleAnalyze = async () => {
    if (isDemoMode) {
      /* Re-run the same analysis rather than apologising for being a demo.
         It is the real function over the real demo rows either way. */
      const found = findOpportunities(
        demoItems as AnalysisItem[],
        demoCategories as AnalysisCategory[]
      );
      setOpportunities(found);
      setHasAnalyzed(true);
      toast.info(
        found.length > 0
          ? `${found.length} ${found.length === 1 ? "thing" : "things"} worth a look.`
          : "Nothing needs attention in the demo inventory."
      );
      return;
    }
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }
      /* Categories come along because the valuation model needs them: the
         category multiplier is looked up by NAME, and without the rows
         every item silently falls back to the unknown-category figure. */
      const [{ data: items }, { data: categoryRows }] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", user.id)
          .not("is_sold", "is", true)
          .not("is_donated", "is", true)
          .not("is_eliminated", "is", true),
        supabase.from("categories").select("id, name"),
      ]);
      if (!items || items.length === 0) {
        toast.info("Add some items first to get insights!");
        return;
      }
      /* Same function the demo runs, so the two cannot drift. */
      const newOpportunities: Opportunity[] = findOpportunities(
        (items ?? []) as AnalysisItem[],
        (categoryRows ?? []) as AnalysisCategory[]
      );

      const excessItems = await analyzeInventoryForExcess(user.id);
      await createExcessInsights(user.id);
      if (excessItems.length > 0) {
        excessItems.forEach((excess) => {
          newOpportunities.push({
            id: `excess-${excess.itemName}`,
            type: "declutter",
            title:
              excess.level === "excessive"
                ? `Excess: ${excess.quantity} ${excess.itemName}`
                : `${excess.quantity} ${excess.itemName} (slightly over)`,
            description: `${excess.reasoning} Typical: ${excess.typical}–${excess.max}`,
            itemCount: excess.quantity,
            icon: AlertTriangle,
            color: "orange",
            action: "Review",
          });
        });
      }

      setOpportunities(newOpportunities);
      setHasAnalyzed(true);
      if (newOpportunities.length > 0) {
        toast.success(`Found ${newOpportunities.length} opportunities!`);
      } else {
        toast.info("Your inventory looks great! No immediate actions needed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze inventory");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Opportunities</CardTitle>
              <p className="text-sm text-muted-foreground">
                Excess, duplicates, and items worth selling or donating
              </p>
            </div>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant={hasAnalyzed ? "outline" : "default"}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Analyzing..." : hasAnalyzed ? "Re-analyze" : "Find Opportunities"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 && !hasAnalyzed ? (
          <div className="text-center py-8">
            <Sparkles className="w-10 h-10 mx-auto text-primary/40 mb-3" />
            <p className="text-muted-foreground mb-1">Click "Find Opportunities" to discover:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="w-3 h-3" /> Items to sell
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Gift className="w-3 h-3" /> Items to donate
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Copy className="w-3 h-3" /> Duplicates
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="w-3 h-3" /> Excess items
              </Badge>
            </div>
          </div>
        ) : opportunities.length === 0 && hasAnalyzed ? (
          <div className="text-center py-8">
            <Sparkles className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <p className="font-medium text-emerald-600">Nothing needs attention.</p>
            <p className="text-sm text-muted-foreground mt-1">
              No immediate actions needed. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => {
              const colors = colorMap[opp.color] ?? colorMap.blue;
              const Icon = opp.icon;
              return (
                <div
                  key={opp.id}
                  className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all cursor-pointer group`}
                  onClick={() => navigate("/dashboard?tab=inventory")}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">{opp.title}</p>
                      <p className="text-xs text-muted-foreground mb-3">{opp.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {opp.itemCount} items
                        </Badge>
                        <span
                          className={`text-xs font-medium ${colors.text} flex items-center gap-1 group-hover:gap-2 transition-all`}
                        >
                          {opp.action}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpportunitiesPanel;
