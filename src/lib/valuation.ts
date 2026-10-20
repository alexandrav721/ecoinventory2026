/**
 * valuation.ts — PORTED FROM THE APP. Keep the two byte-identical below.
 *
 * Source: ecoinventory-mobile/src/lib/valuation.ts
 *
 * WHY THIS FILE EXISTS HERE. The website was estimating resale value as a
 * flat `original_price * 0.6`, on /dashboard, as a dollar figure someone
 * could act on ("4 items could sell for ~$1,240"). The app estimates the
 * same number with three multipliers — condition, category and age — so a
 * five-year-old paperback and a new power drill came out of the website at
 * the same 60% and out of the app hundreds of dollars apart. Two different
 * answers to "what is my stuff worth", from one database, depending on
 * which screen you opened.
 *
 * So the website now runs the app's model rather than its own. Everything
 * below the ADAPTATIONS note is the app's file verbatim; a diff should show
 * only those two hunks. If the app's model changes, copy it over again
 * rather than editing this copy — a local improvement here is how the two
 * surfaces start disagreeing a second time.
 *
 * ADAPTATIONS, and nothing else:
 *   1. ALL_CATEGORY_ROWS does not exist on the web, so the drift warning
 *      checks the category names this codebase actually ships instead.
 *   2. `__DEV__` is React Native; the web equivalent is import.meta.env.DEV.
 *
 * ONE PROPERTY WORTH STATING, because it is load-bearing in both copies:
 * nothing here multiplies by `quantity`. In Loop `quantity` is a "x50"
 * badge on a card, and no money figure in the app has ever used it. The
 * website's dead InventoryStats did, which is one more way the two drifted.
 */

/* ADAPTATION 1 — the app imports ALL_CATEGORY_ROWS from its own category
   vocabulary. The website has no such module, so the drift check below runs
   against the canonical names this map is keyed by. The check is a
   development warning either way: its job is to shout when the vocabulary
   and this map diverge, which is how the last silent-fallback bug hid for
   months. */
const ALL_CATEGORY_ROWS = [
  "Fashion & Accessories",
  "Home & Furniture",
  "Kitchen & Appliances",
  "Electronics & Tech",
  "Tools & DIY",
  "Outdoor & Camping",
  "Sports & Fitness",
  "Events & Party",
  "Kids & Baby",
  "Books & Media",
  "Travel & Luggage",
  "Other",
  "Uncategorized",
];

type ValuationItem = {
  original_price?: number | string | null;
  condition?: string | null;
  category_id?: string | null;
  purchase_date?: string | null;
};

type ValuationCategory = {
  id: string;
  name: string;
};

export type Valuation = {
  spent: number;
  worth: number;
  lost: number;
  priced: number;
  total: number;
  /** Average age across items with a real purchase_date, in years.
   * Items with no purchase date are dropped from the numerator AND
   * denominator so the number reads "average for items where we
   * actually know." Returns 0 when nothing has a date. */
  avgAgeYears: number;
  /** Count of items that contributed to avgAgeYears (= items with a
   * parsable purchase_date). Used by the UI to disclaim "across N
   * items" when needed. */
  ageDated: number;
};

// Condition: how worn-out vs how new.
const CONDITION_RETENTION: Record<string, number> = {
  new: 0.55, // sealed / tags-on still loses 45% the second it leaves the store
  like_new: 0.35,
  good: 0.2,
  fair: 0.1,
  poor: 0.05,
};
const UNKNOWN_CONDITION = 0.2;

// Category: how brutally that whole class of thing depreciates.
// Electronics + books + clothing + toys are punishing on resale;
// tools + outdoor gear actually hold value.
//
// KEYS MUST BE THE CANONICAL CATEGORY NAMES, LOWERCASED. The lookup in
// estimateWorthToday() does `c.name.toLowerCase()`, which yields
// "electronics & tech" — so the old single-word keys ("electronics",
// "tools") never matched and EVERY item silently fell through to
// UNKNOWN_CATEGORY. Fixed June 2026; the assertion below keeps it fixed.
const CATEGORY_MULT: Record<string, number> = {
  "fashion & accessories": 0.5,
  "home & furniture": 0.9,
  "kitchen & appliances": 0.85,
  "electronics & tech": 0.6,
  "tools & diy": 1.0,
  "outdoor & camping": 0.9,
  "sports & fitness": 0.85,
  "events & party": 0.8,
  "kids & baby": 0.6,
  "books & media": 0.3,
  "travel & luggage": 0.85,
  other: 0.8,
  uncategorized: 0.8,
};
const UNKNOWN_CATEGORY = 0.8;

/* ADAPTATION 2 — `__DEV__` is a React Native global. */
if (import.meta.env.DEV) {
  // Fail loudly in development if the vocabulary and this map drift apart
  // again. Silent fallback to 0.8 is exactly how the last bug hid for months.
  const missing = ALL_CATEGORY_ROWS.filter(
    (n) => CATEGORY_MULT[n.toLowerCase()] === undefined
  );
  if (missing.length > 0) {
    console.warn(
      `[valuation] CATEGORY_MULT is missing keys for: ${missing.join(", ")}. ` +
        `Those categories will fall back to ${UNKNOWN_CATEGORY}.`
    );
  }
}

/** Age in years from `purchase_date`. Returns null when the date is
 *  missing or unparseable so callers can distinguish "we don't know"
 *  from "brand new (0 years)". */
function ageYears(purchaseDate: string | null | undefined): number | null {
  if (!purchaseDate) return null;
  const t = Date.parse(purchaseDate);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000);
}

// Age: even pristine stuff loses value over time.
function ageMultiplier(purchaseDate: string | null | undefined): number {
  const years = ageYears(purchaseDate);
  if (years === null) return 1.0;
  if (years > 5) return 0.6;
  if (years > 3) return 0.75;
  if (years > 1) return 0.9;
  return 1.0;
}

/**
 * Per-item depreciated worth — same math as the rollup but for a
 * single row. Returns null when the item has no `original_price`
 * (caller renders "—" or prompts the user to add one). Exposed so
 * the My loop spreadsheet can show a "Worth today" column next to
 * the "Original cost" column.
 */
export function estimateWorthToday(
  item: ValuationItem,
  categories: ValuationCategory[]
): number | null {
  const price = Number(item.original_price ?? 0);
  if (!price || price <= 0) return null;
  const categoryNameById = new Map<string, string>();
  for (const c of categories ?? []) {
    categoryNameById.set(c.id, c.name.toLowerCase());
  }
  const conditionMult = item.condition
    ? (CONDITION_RETENTION[item.condition] ?? UNKNOWN_CONDITION)
    : UNKNOWN_CONDITION;
  const categoryName = item.category_id
    ? categoryNameById.get(item.category_id)
    : undefined;
  const categoryMult = categoryName
    ? (CATEGORY_MULT[categoryName] ?? UNKNOWN_CATEGORY)
    : UNKNOWN_CATEGORY;
  const ageMult = ageMultiplier(item.purchase_date);
  return Math.round(price * conditionMult * categoryMult * ageMult);
}

export function computeValuation(
  items: ValuationItem[],
  categories: ValuationCategory[]
): Valuation {
  const categoryNameById = new Map<string, string>();
  for (const c of categories ?? []) {
    categoryNameById.set(c.id, c.name.toLowerCase());
  }

  let spent = 0;
  let worth = 0;
  let priced = 0;
  // Age accumulator runs independently of the price loop — items can
  // contribute to the average age even if they have no price.
  let ageSum = 0;
  let ageDated = 0;
  for (const it of items) {
    const years = ageYears(it.purchase_date);
    if (years !== null && Number.isFinite(years) && years >= 0) {
      ageSum += years;
      ageDated += 1;
    }

    const price = Number(it.original_price ?? 0);
    if (!price || price <= 0) continue;
    priced += 1;
    spent += price;

    const conditionMult = it.condition
      ? (CONDITION_RETENTION[it.condition] ?? UNKNOWN_CONDITION)
      : UNKNOWN_CONDITION;
    const categoryName = it.category_id
      ? categoryNameById.get(it.category_id)
      : undefined;
    const categoryMult = categoryName
      ? (CATEGORY_MULT[categoryName] ?? UNKNOWN_CATEGORY)
      : UNKNOWN_CATEGORY;
    const ageMult = ageMultiplier(it.purchase_date);

    worth += price * conditionMult * categoryMult * ageMult;
  }
  return {
    spent: Math.round(spent),
    worth: Math.round(worth),
    lost: Math.round(spent - worth),
    priced,
    total: items.length,
    avgAgeYears: ageDated > 0 ? ageSum / ageDated : 0,
    ageDated,
  };
}
