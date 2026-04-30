import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";

interface InventoryStats {
  donatedCount: number;
  eliminatedCount: number;
  freeItemsCount: number;
  soldCount: number;
  profitLoss: number;
  marketValue: number;
}

export const useInventoryStats = () => {
  const { isDemoMode, demoStats } = useDemo();
  const [stats, setStats] = useState<InventoryStats>({
    donatedCount: 0,
    eliminatedCount: 0,
    freeItemsCount: 0,
    soldCount: 0,
    profitLoss: 0,
    marketValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setStats({
        donatedCount: demoStats.donatedCount,
        eliminatedCount: demoStats.eliminatedCount,
        freeItemsCount: demoStats.freeItemsCount,
        soldCount: demoStats.soldCount,
        profitLoss: demoStats.profitLoss,
        marketValue: demoStats.marketValue,
      });
      setLoading(false);
      return;
    }
    fetchStats();
  }, [isDemoMode, demoStats]);

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
        // Active items
        const activeItems = items.filter(item => !item.is_donated && !item.is_sold && !item.is_eliminated);
        
        // Donated statistics
        const donatedItems = items.filter(item => item.is_donated);
        const donatedCount = donatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // Sold statistics
        const soldItems = items.filter(item => item.is_sold);
        const soldCount = soldItems.reduce((sum, item) => sum + item.quantity, 0);
        const soldAmount = soldItems.reduce(
          (sum, item) => sum + ((item.sold_price || 0) * item.quantity),
          0
        );

        // Eliminated statistics
        const eliminatedItems = items.filter(item => item.is_eliminated);
        const eliminatedCount = eliminatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // Free items
        const freeSoldItems = soldItems.filter(item => !item.sold_price || item.sold_price === 0);
        const freeDonatedItems = donatedItems.filter(item => !item.donated_price || item.donated_price === 0);
        const freeItemsCount = freeSoldItems.reduce((sum, item) => sum + item.quantity, 0) + 
                               freeDonatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // Profit/loss
        const soldItemsOriginalCost = soldItems.reduce(
          (sum, item) => sum + ((item.original_price || 0) * item.quantity),
          0
        );
        const profitLoss = soldAmount - soldItemsOriginalCost;

        // Market value
        const { data: marketSoldItems } = await supabase
          .from("inventory_items")
          .select("category_id, sold_price, quantity")
          .eq("is_sold", true)
          .not("sold_price", "is", null)
          .gt("sold_price", 0);

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

        let marketValue = 0;
        activeItems.forEach(item => {
          if (item.category_id && categoryMarketPrices[item.category_id]) {
            const prices = categoryMarketPrices[item.category_id];
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            marketValue += avgPrice * item.quantity;
          }
        });

        setStats({
          donatedCount,
          eliminatedCount,
          freeItemsCount,
          soldCount,
          profitLoss,
          marketValue,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
