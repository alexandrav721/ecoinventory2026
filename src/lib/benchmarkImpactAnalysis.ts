import { supabase } from "@/integrations/supabase/client";

interface ImpactPreview {
  totalUsersAffected: number;
  newInsightsCount: number;
  severityChanges: {
    toExcessive: number;
    toSlightlyOver: number;
    toOk: number;
  };
  affectedUsers: Array<{
    userId: string;
    email: string;
    itemCount: number;
    currentStatus: 'ok' | 'slightly_over' | 'excessive' | 'not_tracked';
    newStatus: 'ok' | 'slightly_over' | 'excessive';
  }>;
}

interface ProposedBenchmark {
  category_key: string;
  typical_quantity: number;
  max_quantity: number;
  keywords: string[];
}

function categorizeLevel(quantity: number, typical: number, max: number): 'ok' | 'slightly_over' | 'excessive' {
  if (quantity <= typical) return 'ok';
  if (quantity <= max) return 'slightly_over';
  return 'excessive';
}

export async function analyzeImpact(proposedBenchmark: ProposedBenchmark): Promise<ImpactPreview> {
  try {
    // Get current benchmark if it exists
    const { data: currentBenchmark } = await supabase
      .from('inventory_benchmarks')
      .select('*')
      .eq('category_key', proposedBenchmark.category_key)
      .single();

    // Fetch all users' items that match the keywords
    const { data: allItems, error } = await supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        quantity,
        user_id,
        is_donated,
        is_sold,
        is_eliminated,
        profiles:user_id (
          email
        )
      `)
      .eq('is_donated', false)
      .eq('is_sold', false)
      .eq('is_eliminated', false);

    if (error || !allItems) {
      console.error('Error fetching items:', error);
      return {
        totalUsersAffected: 0,
        newInsightsCount: 0,
        severityChanges: { toExcessive: 0, toSlightlyOver: 0, toOk: 0 },
        affectedUsers: [],
      };
    }

    // Filter items that match the keywords
    const matchingItems = allItems.filter(item => {
      const lowerName = item.name.toLowerCase();
      return proposedBenchmark.keywords.some(keyword => 
        lowerName.includes(keyword.toLowerCase())
      );
    });

    // Group by user
    const userItemCounts = new Map<string, { email: string; count: number; items: any[] }>();
    
    matchingItems.forEach(item => {
      const existing = userItemCounts.get(item.user_id) || { 
        email: (item.profiles as any)?.email || 'unknown',
        count: 0,
        items: []
      };
      existing.count += item.quantity;
      existing.items.push(item);
      userItemCounts.set(item.user_id, existing);
    });

    // Analyze impact for each user
    const affectedUsers: ImpactPreview['affectedUsers'] = [];
    let newInsightsCount = 0;
    let toExcessive = 0;
    let toSlightlyOver = 0;
    let toOk = 0;

    userItemCounts.forEach((userData, userId) => {
      const currentStatus: 'ok' | 'slightly_over' | 'excessive' | 'not_tracked' = currentBenchmark 
        ? categorizeLevel(userData.count, currentBenchmark.typical_quantity, currentBenchmark.max_quantity)
        : 'not_tracked';
      
      const newStatus = categorizeLevel(
        userData.count, 
        proposedBenchmark.typical_quantity, 
        proposedBenchmark.max_quantity
      );

      // Count as affected if status changes
      const isAffected = currentStatus !== newStatus;

      if (isAffected) {
        affectedUsers.push({
          userId,
          email: userData.email,
          itemCount: userData.count,
          currentStatus: currentStatus as any,
          newStatus,
        });

        // Count new insights (when moving from ok/not_tracked to a problem state)
        if ((currentStatus === 'ok' || currentStatus === 'not_tracked') && newStatus !== 'ok') {
          newInsightsCount++;
        }

        // Track severity changes
        if (newStatus === 'excessive' && currentStatus !== 'excessive' && currentStatus !== 'not_tracked') {
          toExcessive++;
        } else if (newStatus === 'slightly_over' && currentStatus !== 'slightly_over' && currentStatus !== 'not_tracked') {
          toSlightlyOver++;
        } else if (newStatus === 'ok' && currentStatus !== 'ok' && currentStatus !== 'not_tracked') {
          toOk++;
        }
      }
    });

    // Sort by item count descending
    affectedUsers.sort((a, b) => b.itemCount - a.itemCount);

    return {
      totalUsersAffected: affectedUsers.length,
      newInsightsCount,
      severityChanges: {
        toExcessive,
        toSlightlyOver,
        toOk,
      },
      affectedUsers: affectedUsers.slice(0, 10), // Top 10 most affected
    };
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return {
      totalUsersAffected: 0,
      newInsightsCount: 0,
      severityChanges: { toExcessive: 0, toSlightlyOver: 0, toOk: 0 },
      affectedUsers: [],
    };
  }
}
