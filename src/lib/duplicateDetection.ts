import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  color: string | null;
  size: string | null;
  tags: string[];
  image_urls: string[] | null;
  quantity: number;
  category_id: string | null;
}

interface DuplicateGroup {
  items: InventoryItem[];
  similarityScore: number;
  matchReasons: string[];
}

// Calculate string similarity (Levenshtein distance-based)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(s1, s2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity between two items
function calculateSimilarity(item1: InventoryItem, item2: InventoryItem): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  
  // Category match (20 points - helps group similar items)
  if (item1.category_id && item2.category_id && 
      item1.category_id === item2.category_id) {
    score += 20;
    reasons.push('Same category');
  }
  
  // Name similarity (most important - 35 points, adjusted from 40)
  const nameSim = stringSimilarity(item1.name, item2.name);
  if (nameSim >= 0.7) {
    const namePoints = nameSim * 35;
    score += namePoints;
    reasons.push(`Similar names (${Math.round(nameSim * 100)}% match)`);
  }
  
  // Tag overlap (25 points max, adjusted from 30)
  if (item1.tags.length > 0 && item2.tags.length > 0) {
    const commonTags = item1.tags.filter(tag => 
      item2.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
    if (commonTags.length > 0) {
      const tagPoints = (commonTags.length / Math.max(item1.tags.length, item2.tags.length)) * 25;
      score += tagPoints;
      reasons.push(`${commonTags.length} common tag${commonTags.length > 1 ? 's' : ''}: ${commonTags.join(', ')}`);
    }
  }
  
  // Brand match (15 points)
  if (item1.brand && item2.brand && 
      item1.brand.toLowerCase() === item2.brand.toLowerCase()) {
    score += 15;
    reasons.push(`Same brand (${item1.brand})`);
  }
  
  // Color match (10 points)
  if (item1.color && item2.color && 
      item1.color.toLowerCase() === item2.color.toLowerCase()) {
    score += 10;
    reasons.push(`Same color (${item1.color})`);
  }
  
  // Size match (5 points - relevant for clothing)
  if (item1.size && item2.size && 
      item1.size.toLowerCase() === item2.size.toLowerCase()) {
    score += 5;
    reasons.push(`Same size (${item1.size})`);
  }
  
  return { score, reasons };
}

export async function findDuplicates(userId: string): Promise<DuplicateGroup[]> {
  try {
    // Fetch all active items for the user
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('id, name, brand, color, size, tags, image_urls, quantity, category_id')
      .eq('user_id', userId)
      .eq('is_donated', false)
      .eq('is_sold', false)
      .eq('is_eliminated', false);
    
    if (error || !items) {
      console.error('Error fetching items:', error);
      return [];
    }
    
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();
    
    // Compare each item with every other item
    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue;
      
      const group: InventoryItem[] = [items[i] as InventoryItem];
      const similarities: Array<{ item: InventoryItem; score: number; reasons: string[] }> = [];
      
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue;
        
        const { score, reasons } = calculateSimilarity(
          items[i] as InventoryItem,
          items[j] as InventoryItem
        );
        
        // Threshold: 60+ points = likely duplicate
        if (score >= 60) {
          similarities.push({ 
            item: items[j] as InventoryItem, 
            score, 
            reasons 
          });
        }
      }
      
      // If we found similar items, create a duplicate group
      if (similarities.length > 0) {
        similarities.forEach(sim => {
          group.push(sim.item);
          processed.add(sim.item.id);
        });
        processed.add(items[i].id);
        
        // Use the highest similarity score and combine reasons
        const maxScore = Math.max(...similarities.map(s => s.score));
        const allReasons = Array.from(new Set(similarities.flatMap(s => s.reasons)));
        
        duplicateGroups.push({
          items: group,
          similarityScore: maxScore,
          matchReasons: allReasons,
        });
      }
    }
    
    // Sort by similarity score (highest first)
    duplicateGroups.sort((a, b) => b.similarityScore - a.similarityScore);
    
    return duplicateGroups;
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    return [];
  }
}

// Get common tags for autocomplete
export async function getCommonTags(limit: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('common_tags')
      .select('tag_text')
      .order('usage_count', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error fetching common tags:', error);
      return [];
    }
    
    return data.map(t => t.tag_text);
  } catch (error) {
    console.error('Error fetching common tags:', error);
    return [];
  }
}
