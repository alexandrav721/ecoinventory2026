import { supabase } from "@/integrations/supabase/client";

interface Benchmark {
  typical: number;
  max: number;
  reasoning: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category_id: string | null;
  is_donated: boolean | null;
  is_sold: boolean | null;
  is_eliminated: boolean | null;
  categories?: {
    name: string;
  };
}

interface ExcessInsight {
  itemIds: string[];
  itemName: string;
  quantity: number;
  typical: number;
  max: number;
  reasoning: string;
  level: 'slightly_over' | 'excessive';
}

async function findBenchmark(itemName: string): Promise<Benchmark | null> {
  const lowerName = itemName.toLowerCase();
  
  // Fetch all benchmarks
  const { data: benchmarks, error } = await supabase
    .from('inventory_benchmarks')
    .select('*');
  
  if (error || !benchmarks) {
    console.error('Error fetching benchmarks:', error);
    return null;
  }
  
  // Try to match item name to benchmark keywords
  for (const benchmark of benchmarks) {
    for (const keyword of benchmark.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return {
          typical: benchmark.typical_quantity,
          max: benchmark.max_quantity,
          reasoning: benchmark.reasoning,
        };
      }
    }
  }
  
  return null;
}

function categorizeExcessLevel(quantity: number, benchmark: Benchmark): 'ok' | 'slightly_over' | 'excessive' {
  if (quantity <= benchmark.typical) return 'ok';
  if (quantity <= benchmark.max) return 'slightly_over';
  return 'excessive';
}

export async function analyzeInventoryForExcess(userId: string): Promise<ExcessInsight[]> {
  // Fetch active items (not donated, sold, or eliminated)
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      name,
      quantity,
      category_id,
      is_donated,
      is_sold,
      is_eliminated,
      categories (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('is_donated', false)
    .eq('is_sold', false)
    .eq('is_eliminated', false);

  if (error || !items) {
    console.error('Error fetching items:', error);
    return [];
  }

  // Group items by similar names (e.g., all pajamas together)
  const itemGroups = new Map<string, InventoryItem[]>();
  
  for (const item of items) {
    const normalizedName = item.name.toLowerCase().trim();
    
    // Try to find a benchmark for this item
    const benchmark = await findBenchmark(item.name);
    
    if (benchmark) {
      // Group by normalized name
      const existing = itemGroups.get(normalizedName) || [];
      itemGroups.set(normalizedName, [...existing, item as InventoryItem]);
    }
  }

  // Analyze each group
  const insights: ExcessInsight[] = [];
  
  for (const [itemName, groupItems] of itemGroups.entries()) {
    const totalQuantity = groupItems.reduce((sum, item) => sum + item.quantity, 0);
    const benchmark = await findBenchmark(groupItems[0].name);
    
    if (benchmark) {
      const level = categorizeExcessLevel(totalQuantity, benchmark);
      
      if (level !== 'ok') {
        insights.push({
          itemIds: groupItems.map(item => item.id),
          itemName: groupItems[0].name,
          quantity: totalQuantity,
          typical: benchmark.typical,
          max: benchmark.max,
          reasoning: benchmark.reasoning,
          level,
        });
      }
    }
  }

  return insights;
}

export async function createExcessInsights(userId: string): Promise<number> {
  const excessItems = await analyzeInventoryForExcess(userId);
  
  if (excessItems.length === 0) {
    console.log('No excess items found');
    return 0;
  }

  // Delete old excess insights before creating new ones
  await supabase
    .from('inventory_insights')
    .delete()
    .eq('user_id', userId)
    .eq('insight_type', 'excess');

  // Create new insights
  const insightsToCreate = excessItems.map(item => ({
    user_id: userId,
    insight_type: 'excess',
    title: item.level === 'excessive' 
      ? `Too many ${item.itemName}` 
      : `Slightly over on ${item.itemName}`,
    description: item.level === 'excessive'
      ? `You have ${item.quantity} ${item.itemName}, but most people only need ${item.typical}-${item.max}. ${item.reasoning}`
      : `You have ${item.quantity} ${item.itemName}. ${item.reasoning}`,
    priority: item.level === 'excessive' ? 'high' : 'medium',
    related_item_ids: item.itemIds,
    action_recommended: item.level === 'excessive'
      ? 'Consider donating or selling excess items'
      : 'Review if all items are being used',
  }));

  const { error } = await supabase
    .from('inventory_insights')
    .insert(insightsToCreate);

  if (error) {
    console.error('Error creating insights:', error);
    return 0;
  }

  return insightsToCreate.length;
}

export async function getAvailableBenchmarks(): Promise<Array<{ category: string; typical: number; max: number; reasoning: string }>> {
  const { data: benchmarks, error } = await supabase
    .from('inventory_benchmarks')
    .select('*')
    .order('display_name');
  
  if (error || !benchmarks) {
    console.error('Error fetching benchmarks:', error);
    return [];
  }
  
  return benchmarks.map(b => ({
    category: b.display_name,
    typical: b.typical_quantity,
    max: b.max_quantity,
    reasoning: b.reasoning,
  }));
}
