// Curated list of items that are typically worth $50+ and commonly owned.
// Used by the onboarding quiz to help users populate inventory quickly,
// starting with high-impact items (the ones that move the needle for
// "make money / borrow instead of buy").

export type LifestyleTag =
  | "cooks_at_home"
  | "works_out"
  | "outdoors"
  | "travels"
  | "diy"
  | "creative"
  | "gamer"
  | "parent";

export interface HighImpactItem {
  name: string;
  typicalPrice: number; // USD, ballpark mid-market
  category: string; // matches common category names
  room: Room;
  lifestyles?: LifestyleTag[]; // if set, only show when user picked one of these
}

export type Room =
  | "Kitchen"
  | "Living Room"
  | "Bedroom"
  | "Bathroom"
  | "Office"
  | "Garage / Outdoor"
  | "Closet";

export const ROOMS: Room[] = [
  "Kitchen",
  "Living Room",
  "Bedroom",
  "Office",
  "Garage / Outdoor",
  "Closet",
  "Bathroom",
];

export const LIFESTYLE_QUESTIONS: {
  id: LifestyleTag;
  label: string;
  emoji?: string;
}[] = [
  { id: "cooks_at_home", label: "I cook at home regularly" },
  { id: "works_out", label: "I work out or play sports" },
  { id: "outdoors", label: "I camp, hike, or spend time outdoors" },
  { id: "travels", label: "I travel often" },
  { id: "diy", label: "I do DIY, repairs, or home projects" },
  { id: "creative", label: "I'm into photography, music, or art" },
  { id: "gamer", label: "I game or have a serious entertainment setup" },
  { id: "parent", label: "I have kids at home" },
];

export const HIGH_IMPACT_ITEMS: HighImpactItem[] = [
  // Kitchen
  { name: "Stand mixer", typicalPrice: 350, category: "Kitchen", room: "Kitchen", lifestyles: ["cooks_at_home"] },
  { name: "Espresso machine", typicalPrice: 400, category: "Kitchen", room: "Kitchen", lifestyles: ["cooks_at_home"] },
  { name: "Coffee machine", typicalPrice: 120, category: "Kitchen", room: "Kitchen" },
  { name: "Blender", typicalPrice: 90, category: "Kitchen", room: "Kitchen" },
  { name: "Air fryer", typicalPrice: 110, category: "Kitchen", room: "Kitchen" },
  { name: "Instant Pot / pressure cooker", typicalPrice: 100, category: "Kitchen", room: "Kitchen" },
  { name: "Food processor", typicalPrice: 150, category: "Kitchen", room: "Kitchen", lifestyles: ["cooks_at_home"] },
  { name: "Cast iron / Dutch oven", typicalPrice: 200, category: "Kitchen", room: "Kitchen", lifestyles: ["cooks_at_home"] },
  { name: "Knife set", typicalPrice: 150, category: "Kitchen", room: "Kitchen", lifestyles: ["cooks_at_home"] },

  // Living Room
  { name: "TV", typicalPrice: 600, category: "Electronics", room: "Living Room" },
  { name: "Soundbar / speakers", typicalPrice: 250, category: "Electronics", room: "Living Room" },
  { name: "Sofa", typicalPrice: 900, category: "Furniture", room: "Living Room" },
  { name: "Coffee table", typicalPrice: 200, category: "Furniture", room: "Living Room" },
  { name: "Game console", typicalPrice: 400, category: "Electronics", room: "Living Room", lifestyles: ["gamer"] },
  { name: "Vacuum cleaner", typicalPrice: 200, category: "Home", room: "Living Room" },
  { name: "Robot vacuum", typicalPrice: 300, category: "Home", room: "Living Room" },

  // Bedroom
  { name: "Mattress", typicalPrice: 800, category: "Furniture", room: "Bedroom" },
  { name: "Bed frame", typicalPrice: 350, category: "Furniture", room: "Bedroom" },
  { name: "Dresser", typicalPrice: 300, category: "Furniture", room: "Bedroom" },
  { name: "Nightstand", typicalPrice: 120, category: "Furniture", room: "Bedroom" },
  { name: "Air purifier", typicalPrice: 200, category: "Home", room: "Bedroom" },

  // Office
  { name: "Laptop", typicalPrice: 1200, category: "Electronics", room: "Office" },
  { name: "Monitor", typicalPrice: 300, category: "Electronics", room: "Office" },
  { name: "Office chair", typicalPrice: 350, category: "Furniture", room: "Office" },
  { name: "Desk", typicalPrice: 250, category: "Furniture", room: "Office" },
  { name: "Printer", typicalPrice: 150, category: "Electronics", room: "Office" },
  { name: "Tablet / iPad", typicalPrice: 500, category: "Electronics", room: "Office" },
  { name: "Camera (DSLR / mirrorless)", typicalPrice: 800, category: "Electronics", room: "Office", lifestyles: ["creative"] },
  { name: "Headphones (over-ear)", typicalPrice: 250, category: "Electronics", room: "Office" },

  // Garage / Outdoor
  { name: "Bicycle", typicalPrice: 600, category: "Sports & Outdoors", room: "Garage / Outdoor" },
  { name: "Drill / power tool set", typicalPrice: 200, category: "Tools", room: "Garage / Outdoor", lifestyles: ["diy"] },
  { name: "Lawn mower", typicalPrice: 350, category: "Tools", room: "Garage / Outdoor" },
  { name: "Pressure washer", typicalPrice: 200, category: "Tools", room: "Garage / Outdoor", lifestyles: ["diy"] },
  { name: "Camping tent", typicalPrice: 200, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["outdoors"] },
  { name: "Sleeping bag", typicalPrice: 150, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["outdoors"] },
  { name: "Kayak / paddleboard", typicalPrice: 600, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["outdoors"] },
  { name: "Skis / snowboard", typicalPrice: 500, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["outdoors", "works_out"] },
  { name: "Treadmill / exercise bike", typicalPrice: 700, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["works_out"] },
  { name: "Dumbbells / weight set", typicalPrice: 200, category: "Sports & Outdoors", room: "Garage / Outdoor", lifestyles: ["works_out"] },
  { name: "Suitcase (large)", typicalPrice: 200, category: "Travel", room: "Garage / Outdoor", lifestyles: ["travels"] },

  // Closet
  { name: "Winter coat", typicalPrice: 250, category: "Clothing", room: "Closet" },
  { name: "Suit / formal outfit", typicalPrice: 400, category: "Clothing", room: "Closet" },
  { name: "Dress shoes / boots", typicalPrice: 150, category: "Clothing", room: "Closet" },
  { name: "Watch", typicalPrice: 250, category: "Accessories", room: "Closet" },
  { name: "Designer bag", typicalPrice: 300, category: "Accessories", room: "Closet" },

  // Bathroom
  { name: "Hair dryer / styler", typicalPrice: 150, category: "Personal Care", room: "Bathroom" },
  { name: "Electric toothbrush", typicalPrice: 100, category: "Personal Care", room: "Bathroom" },
  { name: "Electric shaver", typicalPrice: 120, category: "Personal Care", room: "Bathroom" },
];

export function filterItemsByLifestyle(
  items: HighImpactItem[],
  selected: LifestyleTag[]
): HighImpactItem[] {
  return items.filter((item) => {
    if (!item.lifestyles || item.lifestyles.length === 0) return true;
    return item.lifestyles.some((tag) => selected.includes(tag));
  });
}
