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

export function categoryToGroup(categoryName: string | null | undefined): TopLevelGroup {
  if (!categoryName) return "Other";
  const n = categoryName.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.group;
  }
  return "Other";
}
