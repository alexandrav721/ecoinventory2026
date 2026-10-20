// Fixed top-level groups used to organize the spreadsheet view.
// The fine-grained category remains the source of truth in the DB and is
// used for analytics, duplicates, and excess detection. This mapping only
// affects how rows are visually grouped.

export type TopLevelGroup =
  | "Electronics"
  | "Furniture"
  | "Kitchen"
  | "Clothing"
  | "Tools"
  | "Outdoor"
  | "Books & Media"
  | "Other";

export const TOP_LEVEL_GROUPS: TopLevelGroup[] = [
  "Electronics",
  "Furniture",
  "Kitchen",
  "Clothing",
  "Tools",
  "Outdoor",
  "Books & Media",
  "Other",
];

// Keyword rules — first match wins. Lowercased substrings.
const RULES: { group: TopLevelGroup; keywords: string[] }[] = [
  {
    group: "Electronics",
    keywords: [
      "electronic", "tech", "computer", "laptop", "phone", "tablet", "tv",
      "television", "audio", "speaker", "headphone", "camera", "console",
      "gaming", "appliance", "smart",
    ],
  },
  {
    group: "Kitchen",
    keywords: ["kitchen", "cookware", "bakeware", "dining", "tableware", "food", "drink"],
  },
  {
    group: "Furniture",
    keywords: ["furniture", "sofa", "chair", "table", "bed", "desk", "shelving", "storage"],
  },
  {
    group: "Clothing",
    keywords: ["cloth", "apparel", "shoe", "footwear", "accessor", "jewel", "bag", "wardrobe"],
  },
  {
    group: "Tools",
    keywords: ["tool", "hardware", "diy", "workshop", "power tool"],
  },
  {
    group: "Outdoor",
    keywords: ["outdoor", "garden", "yard", "patio", "camping", "sport", "fitness", "bike", "exercise"],
  },
  {
    group: "Books & Media",
    keywords: ["book", "media", "music", "movie", "film", "magazine", "game"],
  },
];

/**
 * Loop's category vocabulary is CLOSED — twelve names plus "Uncategorized",
 * fixed in ecoinventory-mobile/src/lib/categories.ts, and users cannot add
 * or rename them. So this is a lookup, not an inference.
 *
 * It used to be keyword matching, first-match-wins, with "appliance" in the
 * Electronics rule and Electronics checked before Kitchen. "Kitchen &
 * Appliances" therefore matched "appliance" and was filed under
 * **Electronics** — so a stand mixer and a cast-iron skillet sat in the
 * Electronics bucket of the dashboard's category filter. Keyword rules are
 * for an open vocabulary; guessing at a list you control is how you get a
 * skillet in Electronics.
 *
 * The keyword rules survive only as a fallback, for a legacy row whose
 * category name predates the locked list.
 */
const EXACT: Record<string, TopLevelGroup> = {
  "electronics & tech": "Electronics",
  "home & furniture": "Furniture",
  "kitchen & appliances": "Kitchen",
  "fashion & accessories": "Clothing",
  "tools & diy": "Tools",
  "outdoor & camping": "Outdoor",
  "sports & fitness": "Outdoor",
  "events & party": "Other",
  "kids & baby": "Other",
  "books & media": "Books & Media",
  "travel & luggage": "Other",
  other: "Other",
  uncategorized: "Other",
};

export function categoryToGroup(categoryName: string | null | undefined): TopLevelGroup {
  if (!categoryName) return "Other";
  const n = categoryName.trim().toLowerCase();
  const exact = EXACT[n];
  if (exact) return exact;
  // Legacy / unrecognised names only.
  for (const rule of RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.group;
  }
  return "Other";
}
