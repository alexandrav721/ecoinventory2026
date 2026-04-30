import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, DollarSign, Calendar, Copy, Heart, TrendingUp, Trash2, Receipt, Gift, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDemo } from "@/contexts/DemoContext";

interface Stats {
  totalItems: number;
  totalValue: number;
  duplicateCount: number;
  averageAge: number;
  donatedCount: number;
  donatedValue: number;
  soldCount: number;
  soldAmount: number;
  eliminatedCount: number;
  marketValue: number;
  averageMarketPrice: number;
  freeItemsCount: number;
  freeItemsPercentage: number;
  profitLoss: number;
}

const InventoryStats = () => {
  const { isDemoMode, demoItems, demoStats } = useDemo();
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    totalValue: 0,
    duplicateCount: 0,
    averageAge: 0,
    donatedCount: 0,
    donatedValue: 0,
    soldCount: 0,
    soldAmount: 0,
    eliminatedCount: 0,
    marketValue: 0,
    averageMarketPrice: 0,
    freeItemsCount: 0,
    freeItemsPercentage: 0,
    profitLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // Calculate demo stats from demo items
      const activeItems = demoItems.filter(item => !item.is_donated && !item.is_sold && !item.is_eliminated);
      const totalItems = activeItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const totalValue = activeItems.reduce((sum, item) => sum + ((item.original_price || 0) * (item.quantity || 1)), 0);
      const duplicateCount = activeItems.filter(item => (item.quantity || 1) > 1).length;
      
      // Calculate average age in months
      const now = new Date();
      const agesInMonths = activeItems
        .filter(item => item.purchase_date)
        .map(item => {
          const purchaseDate = new Date(item.purchase_date!);
          const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
          return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
        });
      const averageAge = agesInMonths.length > 0 
        ? Math.round(agesInMonths.reduce((a, b) => a + b, 0) / agesInMonths.length) 
        : 0;

      setStats({
        totalItems,
        totalValue,
        duplicateCount,
        averageAge,
        donatedCount: 3, // Demo: simulated donations
        donatedValue: 85,
        soldCount: 2, // Demo: simulated sales
        soldAmount: 150,
        eliminatedCount: 1,
        marketValue: Math.round(totalValue * 0.65), // Estimated market value
        averageMarketPrice: Math.round(totalValue * 0.65 / totalItems),
        freeItemsCount: 1,
        freeItemsPercentage: 20,
        profitLoss: 45, // Demo: simulated profit
      });
      setLoading(false);
    } else {
      fetchStats();
    }
  }, [isDemoMode, demoItems]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: items, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (items) {
        // Calculate active items (not donated, sold, or eliminated)
        const activeItems = items.filter(item => !item.is_donated && !item.is_sold && !item.is_eliminated);
        
        const totalValue = activeItems.reduce(
          (sum, item) => sum + ((item.original_price || 0) * item.quantity),
          0
        );

        // Calculate duplicates (items with quantity > 1)
        const duplicateCount = activeItems.filter((item) => item.quantity > 1).length;

        // Calculate average age in months for active items
        const now = new Date();
        const agesInMonths = activeItems
          .filter((item) => item.purchase_date)
          .map((item) => {
            const purchaseDate = new Date(item.purchase_date);
            const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
            return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
          });
        const averageAge =
          agesInMonths.length > 0
            ? Math.round(agesInMonths.reduce((a, b) => a + b, 0) / agesInMonths.length)
            : 0;

        // Calculate donated statistics
        const donatedItems = items.filter(item => item.is_donated);
        const donatedCount = donatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const donatedValue = donatedItems.reduce(
          (sum, item) => sum + ((item.donated_price || item.original_price || 0) * item.quantity),
          0
        );

        // Calculate sold statistics
        const soldItems = items.filter(item => item.is_sold);
        const soldCount = soldItems.reduce((sum, item) => sum + item.quantity, 0);
        const soldAmount = soldItems.reduce(
          (sum, item) => sum + ((item.sold_price || 0) * item.quantity),
          0
        );

        // Calculate eliminated statistics
        const eliminatedItems = items.filter(item => item.is_eliminated);
        const eliminatedCount = eliminatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // Calculate market value based on sold items across the platform
        // Fetch all sold items from all users (excluding free sales)
        const { data: marketSoldItems } = await supabase
          .from("inventory_items")
          .select("category_id, sold_price, quantity")
          .eq("is_sold", true)
          .not("sold_price", "is", null)
          .gt("sold_price", 0);

        // Calculate average market prices by category
        const categoryMarketPrices: Record<string, number[]> = {};
        if (marketSoldItems) {
          marketSoldItems.forEach(item => {
            if (item.category_id) {
              if (!categoryMarketPrices[item.category_id]) {
                categoryMarketPrices[item.category_id] = [];
              }
              categoryMarketPrices[item.category_id].push(item.sold_price);
            }
          });
        }

        // Calculate market value for user's active inventory
        let marketValue = 0;
        let marketPriceCount = 0;
        
        activeItems.forEach(item => {
          if (item.category_id && categoryMarketPrices[item.category_id]) {
            const prices = categoryMarketPrices[item.category_id];
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            marketValue += avgPrice * item.quantity;
            marketPriceCount += item.quantity;
          }
        });

        const averageMarketPrice = marketPriceCount > 0 ? marketValue / marketPriceCount : 0;

        // Calculate free items (sold for $0 or donated for $0)
        const freeSoldItems = soldItems.filter(item => !item.sold_price || item.sold_price === 0);
        const freeDonatedItems = donatedItems.filter(item => !item.donated_price || item.donated_price === 0);
        const freeItemsCount = freeSoldItems.reduce((sum, item) => sum + item.quantity, 0) + 
                               freeDonatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        const totalGivenAway = soldCount + donatedCount;
        const freeItemsPercentage = totalGivenAway > 0 ? Math.round((freeItemsCount / totalGivenAway) * 100) : 0;

        // Calculate profit/loss (sold amount - original cost of sold items)
        const soldItemsOriginalCost = soldItems.reduce(
          (sum, item) => sum + ((item.original_price || 0) * item.quantity),
          0
        );
        const profitLoss = soldAmount - soldItemsOriginalCost;

        setStats({
          totalItems: activeItems.reduce((sum, item) => sum + item.quantity, 0),
          totalValue,
          duplicateCount,
          averageAge,
          donatedCount,
          donatedValue,
          soldCount,
          soldAmount,
          eliminatedCount,
          marketValue,
          averageMarketPrice,
          freeItemsCount,
          freeItemsPercentage,
          profitLoss,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      description: "items in inventory",
    },
    {
      title: "Original Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      description: "what you paid",
    },
    {
      title: "Market Value",
      value: formatCurrency(stats.marketValue),
      icon: TrendingUp,
      description: "potential earnings",
      highlight: stats.marketValue > 0,
      tooltip: "This is what your current inventory could sell for based on actual sale prices from similar items across EcoInventory. We analyze sold items by category to estimate your earning potential.",
      dataMetric: "market-value",
    },
    {
      title: "Avg Market Price",
      value: formatCurrency(stats.averageMarketPrice),
      icon: Receipt,
      description: "per item on EcoInventory",
      highlight: stats.averageMarketPrice > 0,
      tooltip: "The average selling price per item in your inventory based on real marketplace data. This helps you price your items competitively and understand what buyers are willing to pay.",
      dataMetric: "avg-market",
    },
    {
      title: "Your Profit/Loss",
      value: formatCurrency(Math.abs(stats.profitLoss)),
      icon: TrendingUp,
      description: stats.soldCount > 0 ? (stats.profitLoss >= 0 ? "profit from sales" : "loss from sales") : "no sales yet",
      negative: stats.profitLoss < 0,
      tooltip: "Your actual profit or loss from items you've sold. Calculated as: (Total Sold Amount) - (Original Cost of Sold Items). Green means you're making money, red means selling below cost.",
    },
    {
      title: "Free Items",
      value: stats.freeItemsCount,
      icon: Gift,
      description: `${stats.freeItemsPercentage}% given free`,
      highlight: stats.freeItemsCount > 0,
      tooltip: "Items you've donated or sold for free. High percentages might mean missed earning opportunities if these items have market value.",
      dataMetric: "free-items",
    },
    {
      title: "Items Donated",
      value: stats.donatedCount,
      icon: Heart,
      description: `${formatCurrency(stats.donatedValue)} value`,
    },
    {
      title: "Items Eliminated",
      value: stats.eliminatedCount,
      icon: Trash2,
      description: "thrown out/disposed",
    },
    {
      title: "Duplicate Items",
      value: stats.duplicateCount,
      icon: Copy,
      description: "items with qty > 1",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-l border-border/60">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border-r border-b border-border/60 p-5 animate-pulse">
            <div className="h-3 bg-muted rounded w-20 mb-3" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-l border-border/60">
        {statCards.map((stat, idx) => {
          const isNegative = (stat as any).negative;
          return (
            <div
              key={stat.title}
              data-metric={(stat as any).dataMetric}
              className="group relative border-r border-b border-border/60 p-5 transition-colors hover:bg-muted/30"
            >
              {/* Section number, magazine-style */}
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                  § {String(idx + 1).padStart(2, '0')}
                </span>
                {(stat as any).tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help hover:text-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{(stat as any).tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Label — lowercase italic, editorial */}
              <p className="text-xs italic text-muted-foreground mb-2 lowercase">
                {stat.title}
              </p>

              {/* The number — oversized Fraunces serif */}
              <div
                className={`font-display font-light leading-none tracking-tight mb-2 ${
                  isNegative ? 'text-destructive' : 'text-foreground'
                }`}
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {isNegative && '−'}{stat.value}
              </div>

              {/* Description — hairline above */}
              <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-border/40">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default InventoryStats;
