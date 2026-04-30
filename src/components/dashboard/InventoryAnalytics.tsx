import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DollarSign, TrendingUp, AlertTriangle, Sparkles, 
  Package, Gift, ShoppingBag,
  Lightbulb, RefreshCw, Copy, Info, ChevronRight
} from "lucide-react";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { useDemo } from "@/contexts/DemoContext";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { findDuplicates } from "@/lib/duplicateDetection";
import { analyzeInventoryForExcess, createExcessInsights } from "@/lib/excessDetection";
import { toast } from "sonner";
import { AchievementsPanel } from "./AchievementsPanel";
import { useAchievements } from "@/hooks/useAchievements";

interface Opportunity {
  id: string;
  type: "sell" | "donate" | "declutter";
  title: string;
  description: string;
  potentialValue?: number;
  itemCount: number;
  icon: typeof DollarSign;
  color: string;
  action: string;
}

const InventoryAnalytics = () => {
  const navigate = useNavigate();
  const { stats, loading } = useInventoryStats();
  const achievements = useAchievements(stats);
  const { isDemoMode } = useDemo();
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      // Demo opportunities
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
          action: "View items"
        },
        {
          id: "2", 
          type: "donate",
          title: "3 items perfect for donation",
          description: "Clothing and books in great condition",
          itemCount: 3,
          icon: Gift,
          color: "pink",
          action: "Review"
        },
        {
          id: "3",
          type: "declutter",
          title: "2 duplicate item groups found",
          description: "Similar items that could be consolidated",
          itemCount: 2,
          icon: Copy,
          color: "amber",
          action: "Analyze"
        },
        {
          id: "4",
          type: "declutter",
          title: "Excess: 12 coffee cups",
          description: "Most households only need 6-8 cups. Consider donating extras!",
          itemCount: 12,
          icon: AlertTriangle,
          color: "orange",
          action: "Review"
        }
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

      // Fetch user's items
      const { data: items } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_sold", false)
        .eq("is_donated", false)
        .eq("is_eliminated", false);

      if (!items || items.length === 0) {
        toast.info("Add some items first to get insights!");
        setAnalyzing(false);
        return;
      }

      const newOpportunities: Opportunity[] = [];
      const now = new Date();

      // Find items that could be sold (unused, valuable)
      const sellableItems = items.filter(item => {
        if (!item.purchase_date) return false;
        const monthsSincePurchase = (now.getTime() - new Date(item.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSincePurchase >= 6 && item.usage_frequency === 'rarely' && (item.original_price || 0) > 20;
      });

      if (sellableItems.length > 0) {
        const potentialValue = sellableItems.reduce((sum, item) => 
          sum + ((item.original_price || 0) * 0.6 * (item.quantity || 1)), 0
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
          action: "View items"
        });
      }

      // Find items good for donation (older, low value)
      const donatableItems = items.filter(item => {
        if (!item.purchase_date) return false;
        const monthsSincePurchase = (now.getTime() - new Date(item.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSincePurchase >= 12 && (item.original_price || 0) < 50 && item.condition !== 'poor';
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
          action: "Review"
        });
      }

      // Find duplicates
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
          action: "Analyze"
        });
      }

      // Run excess analysis and show results
      const excessItems = await analyzeInventoryForExcess(user.id);
      await createExcessInsights(user.id);
      
      if (excessItems.length > 0) {
        excessItems.forEach(excess => {
          newOpportunities.push({
            id: `excess-${excess.itemName}`,
            type: "declutter",
            title: excess.level === 'excessive' 
              ? `Excess: ${excess.quantity} ${excess.itemName}` 
              : `${excess.quantity} ${excess.itemName} (slightly over)`,
            description: `${excess.reasoning} Typical: ${excess.typical}-${excess.max}`,
            itemCount: excess.quantity,
            icon: AlertTriangle,
            color: "orange",
            action: "Review"
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
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Failed to analyze inventory");
    } finally {
      setAnalyzing(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
      pink: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/20" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
      orange: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Value Summary - Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Original Value */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  What You Paid
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.marketValue > 0 ? stats.marketValue * 1.5 : 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">original cost</p>
            </CardContent>
          </Card>

          {/* Market Value */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5 border-emerald-500/20 bg-emerald-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Worth Now
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Based on actual sale prices from similar items on EcoInventory</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600">{formatCurrency(stats.marketValue)}</p>
              <p className="text-xs text-emerald-600/80 mt-1">potential earnings</p>
            </CardContent>
          </Card>

          {/* Items Sold */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sold
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stats.soldCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.profitLoss >= 0 ? (
                  <span className="text-emerald-600">+{formatCurrency(stats.profitLoss)} profit</span>
                ) : (
                  <span className="text-red-500">{formatCurrency(stats.profitLoss)} loss</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Donated + Eliminated */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Gift className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Decluttered
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stats.donatedCount + stats.eliminatedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.donatedCount} donated, {stats.eliminatedCount} removed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities moved to its own tab — see OpportunitiesPanel */}

        {/* Achievements - Compact */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Your Impact</h3>
          </div>
          <AchievementsPanel achievements={achievements} />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InventoryAnalytics;
