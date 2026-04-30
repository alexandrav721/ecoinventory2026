import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExcessInsight {
  itemIds: string[];
  itemName: string;
  quantity: number;
  typical: number;
  max: number;
  reasoning: string;
  level: 'slightly_over' | 'excessive';
}

interface ExcessMap {
  [itemId: string]: ExcessInsight;
}

export function useExcessInsights(userId?: string) {
  const [excessMap, setExcessMap] = useState<ExcessMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchExcessInsights();
  }, [userId]);

  const fetchExcessInsights = async () => {
    try {
      // Fetch stored excess insights from the database
      const { data: insights, error } = await supabase
        .from('inventory_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('insight_type', 'excess')
        .eq('is_dismissed', false);

      if (error) {
        console.error('Error fetching excess insights:', error);
        setLoading(false);
        return;
      }

      // Build a map from item IDs to their excess insight
      const map: ExcessMap = {};
      
      insights?.forEach(insight => {
        const isExcessive = insight.priority === 'high';
        // Parse the description to extract numbers
        const quantityMatch = insight.description.match(/You have (\d+)/);
        const typicalMatch = insight.description.match(/only need (\d+)-(\d+)/);
        
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
        const typical = typicalMatch ? parseInt(typicalMatch[1]) : 0;
        const max = typicalMatch ? parseInt(typicalMatch[2]) : 0;

        const excessInfo: ExcessInsight = {
          itemIds: insight.related_item_ids || [],
          itemName: insight.title.replace(/^(Too many |Slightly over on )/, ''),
          quantity,
          typical,
          max,
          reasoning: insight.action_recommended || '',
          level: isExcessive ? 'excessive' : 'slightly_over',
        };

        // Map each related item ID to this insight
        (insight.related_item_ids || []).forEach((itemId: string) => {
          map[itemId] = excessInfo;
        });
      });

      setExcessMap(map);
    } catch (error) {
      console.error('Error in useExcessInsights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExcessForItem = (itemId: string): ExcessInsight | null => {
    return excessMap[itemId] || null;
  };

  const refresh = () => {
    if (userId) {
      setLoading(true);
      fetchExcessInsights();
    }
  };

  return { excessMap, getExcessForItem, loading, refresh };
}
