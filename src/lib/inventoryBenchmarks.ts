// Curated benchmarks for typical item quantities
// Based on research about minimalism, organization, and typical household needs

export interface Benchmark {
  typical: number;
  max: number;
  reasoning: string;
}

export const CATEGORY_BENCHMARKS: Record<string, Benchmark> = {
  // Clothing - Sleepwear
  'pajamas': { typical: 3, max: 5, reasoning: 'Most people need 2-3 pairs for weekly laundry cycles' },
  'sleepwear': { typical: 3, max: 5, reasoning: 'Most people need 2-3 pairs for weekly laundry cycles' },
  
  // Clothing - Bottoms
  'jeans': { typical: 5, max: 8, reasoning: 'A capsule wardrobe typically includes 4-6 pairs' },
  'pants': { typical: 5, max: 8, reasoning: 'A capsule wardrobe typically includes 4-6 pairs' },
  'shorts': { typical: 4, max: 6, reasoning: 'Seasonal needs typically require 3-5 pairs' },
  'leggings': { typical: 4, max: 6, reasoning: 'Active and casual wear typically needs 3-5 pairs' },
  
  // Clothing - Tops
  'tshirt': { typical: 8, max: 12, reasoning: 'A versatile wardrobe includes 6-10 basic tees' },
  't-shirt': { typical: 8, max: 12, reasoning: 'A versatile wardrobe includes 6-10 basic tees' },
  'shirt': { typical: 8, max: 12, reasoning: 'Work and casual needs typically require 6-10 shirts' },
  'sweater': { typical: 5, max: 8, reasoning: 'Seasonal rotation typically needs 4-6 sweaters' },
  'hoodie': { typical: 3, max: 5, reasoning: 'Most people use 2-4 hoodies regularly' },
  
  // Clothing - Outerwear
  'jacket': { typical: 3, max: 5, reasoning: 'Seasonal variety typically requires 2-4 jackets' },
  'coat': { typical: 2, max: 3, reasoning: 'One winter, one rain coat is typically sufficient' },
  'winter_coat': { typical: 2, max: 3, reasoning: 'One everyday, one formal is typically enough' },
  
  // Shoes
  'shoes': { typical: 8, max: 12, reasoning: 'Minimalist wardrobe includes 6-10 pairs (casual, formal, athletic, seasonal)' },
  'sneakers': { typical: 3, max: 5, reasoning: 'Everyday, athletic, and backup is typically enough' },
  'boots': { typical: 2, max: 4, reasoning: 'Seasonal needs typically require 2-3 pairs' },
  'sandals': { typical: 2, max: 3, reasoning: 'Casual and dressy options cover most needs' },
  
  // Kitchen - Appliances
  'coffee_maker': { typical: 1, max: 2, reasoning: 'One machine is sufficient for most households' },
  'blender': { typical: 1, max: 2, reasoning: 'One blender covers most blending needs' },
  'toaster': { typical: 1, max: 1, reasoning: 'Multiple toasters are typically unnecessary' },
  'microwave': { typical: 1, max: 1, reasoning: 'One microwave per household is standard' },
  'mixer': { typical: 1, max: 2, reasoning: 'One stand or hand mixer is typically sufficient' },
  
  // Kitchen - Cookware
  'pan': { typical: 4, max: 6, reasoning: 'A basic set includes 3-5 pans (small, medium, large, specialty)' },
  'pot': { typical: 4, max: 6, reasoning: 'A basic set includes 3-5 pots of varying sizes' },
  'baking_sheet': { typical: 3, max: 5, reasoning: 'Multiple sizes for different baking needs' },
  
  // Kitchen - Dishes
  'plate': { typical: 8, max: 12, reasoning: 'Service for 4-6 people plus extras' },
  'bowl': { typical: 8, max: 12, reasoning: 'Service for 4-6 people plus extras' },
  'mug': { typical: 6, max: 10, reasoning: 'One per person plus favorites and guests' },
  'glass': { typical: 8, max: 12, reasoning: 'Service for 4-6 people plus extras' },
  
  // Electronics
  'phone': { typical: 1, max: 2, reasoning: 'One active, one backup/old device' },
  'laptop': { typical: 1, max: 2, reasoning: 'One personal, one work device for most people' },
  'tablet': { typical: 1, max: 2, reasoning: 'Most people use 1-2 tablets max' },
  'tv': { typical: 2, max: 3, reasoning: 'Living room and bedroom coverage' },
  'game_console': { typical: 1, max: 2, reasoning: 'Current and previous generation' },
  
  // Bedding
  'pillow': { typical: 4, max: 6, reasoning: 'Two per person plus decorative pillows' },
  'sheet_set': { typical: 3, max: 4, reasoning: 'Two in use, one in wash, one backup' },
  'blanket': { typical: 3, max: 5, reasoning: 'Different weights for seasons plus backups' },
  'comforter': { typical: 2, max: 3, reasoning: 'One in use, one seasonal alternate' },
  
  // Bath
  'towel': { typical: 6, max: 10, reasoning: 'Two per person plus guest towels' },
  'hand_towel': { typical: 4, max: 6, reasoning: 'Multiple locations plus rotation' },
  'washcloth': { typical: 8, max: 12, reasoning: 'Daily use requires regular rotation' },
  
  // Bags
  'backpack': { typical: 2, max: 4, reasoning: 'Daily use, travel, and specialty needs' },
  'purse': { typical: 3, max: 5, reasoning: 'Casual, formal, and seasonal options' },
  'suitcase': { typical: 3, max: 4, reasoning: 'Carry-on, checked, and weekend bag' },
  
  // Books & Media
  'book': { typical: 30, max: 100, reasoning: 'Personal library varies, but excessive hoarding adds clutter' },
  'magazine': { typical: 5, max: 10, reasoning: 'Keep current issues, recycle old ones' },
  
  // Tools
  'screwdriver': { typical: 2, max: 4, reasoning: 'Phillips and flathead in different sizes' },
  'hammer': { typical: 1, max: 2, reasoning: 'One standard hammer covers most needs' },
  'drill': { typical: 1, max: 2, reasoning: 'One corded or cordless drill is typically enough' },
  
  // Sports & Fitness
  'yoga_mat': { typical: 1, max: 2, reasoning: 'One for home, one for travel/backup' },
  'dumbbell': { typical: 4, max: 8, reasoning: 'Pairs in different weights for progression' },
  'bicycle': { typical: 1, max: 3, reasoning: 'Road, mountain, or commuter based on use' },
};

// Keywords to match item names to benchmark categories
export const ITEM_NAME_MATCHERS: Record<string, string[]> = {
  'pajamas': ['pajama', 'pj', 'sleepwear', 'nightgown'],
  'jeans': ['jean', 'denim'],
  'pants': ['pant', 'trouser', 'slack'],
  'shorts': ['short'],
  'leggings': ['legging', 'tight'],
  'tshirt': ['t-shirt', 'tshirt', 'tee'],
  'shirt': ['shirt', 'blouse', 'top'],
  'sweater': ['sweater', 'pullover', 'jumper'],
  'hoodie': ['hoodie', 'sweatshirt'],
  'jacket': ['jacket', 'blazer'],
  'coat': ['coat', 'parka'],
  'shoes': ['shoe'],
  'sneakers': ['sneaker', 'trainer', 'running shoe'],
  'boots': ['boot'],
  'sandals': ['sandal', 'flip-flop', 'slipper'],
  'coffee_maker': ['coffee maker', 'espresso', 'french press', 'coffee machine'],
  'blender': ['blender', 'food processor'],
  'toaster': ['toaster'],
  'microwave': ['microwave'],
  'mixer': ['mixer', 'hand mixer', 'stand mixer'],
  'pan': ['pan', 'skillet', 'frying pan'],
  'pot': ['pot', 'saucepan'],
  'plate': ['plate', 'dish'],
  'bowl': ['bowl'],
  'mug': ['mug', 'coffee cup'],
  'glass': ['glass', 'cup', 'tumbler'],
  'phone': ['phone', 'smartphone', 'iphone', 'android'],
  'laptop': ['laptop', 'notebook', 'macbook'],
  'tablet': ['tablet', 'ipad'],
  'tv': ['tv', 'television'],
  'pillow': ['pillow'],
  'towel': ['bath towel', 'towel'],
  'backpack': ['backpack', 'rucksack'],
  'purse': ['purse', 'handbag'],
  'book': ['book', 'novel'],
  'yoga_mat': ['yoga mat', 'exercise mat'],
};

export function findBenchmark(itemName: string, categoryName?: string): Benchmark | null {
  const lowerName = itemName.toLowerCase();
  const lowerCategory = categoryName?.toLowerCase();
  
  // First try exact match with category
  if (lowerCategory && CATEGORY_BENCHMARKS[lowerCategory]) {
    return CATEGORY_BENCHMARKS[lowerCategory];
  }
  
  // Then try matching item name to benchmark keywords
  for (const [benchmarkKey, keywords] of Object.entries(ITEM_NAME_MATCHERS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return CATEGORY_BENCHMARKS[benchmarkKey];
      }
    }
  }
  
  return null;
}

export function categorizeExcessLevel(quantity: number, benchmark: Benchmark): 'ok' | 'slightly_over' | 'excessive' {
  if (quantity <= benchmark.typical) return 'ok';
  if (quantity <= benchmark.max) return 'slightly_over';
  return 'excessive';
}
