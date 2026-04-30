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
import { findDuplicates } from "@/lib/duplicateDetection";
import { analyzeInventoryForExcess, createExcessInsights } from "@/lib/excessDetection";
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

export const OpportunitiesPanel = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setOpportunities([
        {
          id: "1",
          type: "sell",
          title: "5 items could sell for ~$320",
          description: "Rarely used electronics and gear with good resale value",
          potentialValue: 320,
          itemCount: 5,
          icon: DollarSign,
          color: "emerald",
          action: "View items",
        },
        {
          id: "2",
          type: "donate",
          title: "3 items perfect for donation",
          description: "Clothing and books in great condition",
          itemCount: 3,
          icon: Gift,
          color: "pink",
          action: "Review",
        },
        {
          id: "3",
          type: "declutter",
          title: "2 duplicate item groups found",
          description: "Similar items that could be consolidated",
          itemCount: 2,
          icon: Copy,
          color: "amber",
          action: "Analyze",
        },
        {
          id: "4",
          type: "declutter",
          title: "Excess: 12 coffee cups",
          description: "Most households only need 6–8 cups. Consider donating extras!",
          itemCount: 12,
          icon: AlertTriangle,
          color: "orange",
          action: "Review",
        },
      ]);
      setHasAnalyzed(true);
    }
  }, [isDemoMode]);

  const handleAnalyze = async () => {
    if (isDemoMode) {
      toast.info("In the full app, this analyzes your inventory for opportunities!");
      return;
    }
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }
      const { data: items } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_sold", false)
        .eq("is_donated", false)
        .eq("is_eliminated", false);
      if (!items || items.length === 0) {
        toast.info("Add some items first to get insights!");
        return;
      }
      const newOpportunities: Opportunity[] = [];
      const now = new Date();

      const sellableItems = items.filter((item) => {
        if (!item.purchase_date) return false;
        const monthsSincePurchase =
          (now.getTime() - new Date(item.purchase_date).getTime()) /
          (1000 * 60 * 60 * 24 * 30);
        return (
          monthsSincePurchase >= 6 &&
          item.usage_frequency === "rarely" &&
          (item.original_price || 0) > 20
        );
      });
      if (sellableItems.length > 0) {
        const potentialValue = sellableItems.reduce(
          (sum, item) =>
            sum + (item.original_price || 0) * 0.6 * (item.quantity || 1),
          0
        );
        newOpportunities.push({
          id: "sell",
          type: "sell",
          title: `${sellableItems.length} items could sell for ~${formatCurrency(potentialValue)}`,
          description: "Rarely used items with resale value",
          potentialValue,
          itemCount: sellableItems.length,
          icon: DollarSign,
          color: "emerald",
          action: "View items",
        });
      }

      const donatableItems = items.filter((item) => {
        if (!item.purchase_date) return false;
        const monthsSincePurchase =
          (now.getTime() - new Date(item.purchase_date).getTime()) /
          (1000 * 60 * 60 * 24 * 30);
        return (
          monthsSincePurchase >= 12 &&
          (item.original_price || 0) < 50 &&
          item.condition !== "poor"
        );
      });
      if (donatableItems.length >= 2) {
        newOpportunities.push({
          id: "donate",
          type: "donate",
          title: `${donatableItems.length} items perfect for donation`,
          description: "Older items in good condition others could use",
          itemCount: donatableItems.length,
          icon: Gift,
          color: "pink",
          action: "Review",
        });
      }

      const duplicateGroups = await findDuplicates(user.id);
      if (duplicateGroups.length > 0) {
        newOpportunities.push({
          id: "duplicates",
          type: "declutter",
          title: `${duplicateGroups.length} duplicate item groups found`,
          description: "Similar items that could be consolidated",
          itemCount: duplicateGroups.reduce((sum, g) => sum + g.items.length, 0),
          icon: Copy,
          color: "amber",
          action: "Analyze",
        });
      }

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
            <p className="font-medium text-emerald-600">Your inventory looks great! 🎉</p>
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
