/**
 * homeSummary — the model behind Home's one-glance summary.
 *
 * WHY THIS IS A PURE FUNCTION. The same numbers have to appear on the app's
 * Home tab and on the website's home page, and the two read the same
 * database. If each surface counts for itself they will disagree the first
 * time somebody changes a predicate, and a user who sees "12 things" in one
 * place and "14" in the other stops believing either. So the counting rule
 * lives here, alone, with no React and no Supabase in it, and both surfaces
 * port THIS file rather than re-derive it.
 *
 * THIS IS THE WEBSITE'S COPY. The original is
 * ecoinventory-mobile/src/lib/homeSummary.ts. They must stay byte-identical
 * below this header — that is the entire point of the file. If you change
 * the shelf precedence here and not there, the app and the website will
 * quietly disagree about what someone owns, which is the exact failure this
 * file was written to prevent.
 *
 * ── THE RULE THAT MATTERS: SHELVES ARE MUTUALLY EXCLUSIVE ──────────────
 *
 * `is_for_sale` and `is_for_borrow` are independent booleans. An item can
 * be both — "I'd lend it, or I'd sell it for the right price" is a normal
 * thing to mean, and the Add screen lets you say it.
 *
 * That is fine for a filter and fatal for a summary. A ring whose segments
 * add up to more than the number in the middle of it is the single fastest
 * way to lose a reader's trust, and they will never tell you why they
 * stopped trusting it — they will just stop reading the screen.
 *
 * So every item lands on exactly ONE shelf, by precedence:
 *
 *     for sale  →  to lend  →  private
 *
 * Sale wins over lend because it is the more committed, more irreversible
 * intent: an item you would sell is already further out of your life than
 * one you would lend. The counts therefore always sum to the total, and
 * the ring is always honest.
 *
 * A consequence worth knowing: an item that is both for sale and for
 * borrow is counted under "for sale" only, so "to lend" reads LOW relative
 * to what a filter on is_for_borrow would return. That is the correct
 * trade — the screen's job is to partition, not to tally intents.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────
 *
 * No money. `original_price` and `purchase_date` are nullable and in
 * practice often empty, so any "your stuff is worth $X" headline on a
 * summary screen would be computed off whatever fraction of rows happened
 * to be filled in, presented as if it were the whole collection. If a
 * money figure ever lands on Home it must carry its own denominator.
 *
 * No usage. `usage_frequency` is the owner's own one-time answer, not a
 * log of anything. It can support an estimate, clearly labelled, on a
 * screen built to explain itself. Home is not that screen.
 */

/** The one shelf an item sits on. Exhaustive and mutually exclusive. */
export type ShelfKey = "sale" | "lend" | "private";

export type Shelf = {
  key: ShelfKey;
  /** Sentence case — these are read as labels under a number, not headings. */
  label: string;
  count: number;
};

/**
 * The fields the summary actually reads. Deliberately narrow: `useMyInventory`
 * selects "*", but naming only what we touch means a schema change elsewhere
 * can't silently alter these numbers.
 */
export type HomeItem = {
  id: string;
  name?: string | null;
  image_urls?: string[] | null;
  is_for_sale?: boolean | null;
  is_for_borrow?: boolean | null;
  is_sold?: boolean | null;
  is_donated?: boolean | null;
  created_at?: string | null;
};

export type HomeSummary = {
  /** Things still yours. Excludes anything sold or given away. */
  total: number;
  /** Always sums to `total`. Zero-count shelves are kept, in fixed order. */
  shelves: Shelf[];
  /** Sold or donated — gone, but worth acknowledging rather than vanishing. */
  movedOn: number;
  /**
   * Things with no photo. These exist for the owner and are invisible to
   * everyone else, which is Loop's rule — so this is the one number on the
   * screen a user can act on immediately, and the only reason it is here.
   */
  missingPhoto: number;
  /** Newest first, already capped. */
  latest: HomeItem[];
};

const SHELF_ORDER: ShelfKey[] = ["sale", "lend", "private"];

const SHELF_LABEL: Record<ShelfKey, string> = {
  sale: "For sale",
  lend: "To lend",
  private: "Private",
};

/** True when the item has left the collection. */
export function hasMovedOn(item: HomeItem): boolean {
  return item.is_sold === true || item.is_donated === true;
}

/** True when nobody but the owner can see this item. */
export function isMissingPhoto(item: HomeItem): boolean {
  const urls = item.image_urls;
  if (!Array.isArray(urls)) return true;
  return urls.filter((u) => typeof u === "string" && u.trim() !== "").length === 0;
}

/**
 * The item's single shelf. See the precedence note at the top of the file —
 * this is the function that keeps the ring honest.
 */
export function shelfOf(item: HomeItem): ShelfKey {
  if (item.is_for_sale === true) return "sale";
  if (item.is_for_borrow === true) return "lend";
  return "private";
}

export function buildHomeSummary(
  items: HomeItem[] | null | undefined,
  opts: { latestCount?: number } = {}
): HomeSummary {
  const latestCount = opts.latestCount ?? 6;
  const rows = Array.isArray(items) ? items : [];

  const counts: Record<ShelfKey, number> = { sale: 0, lend: 0, private: 0 };
  let total = 0;
  let movedOn = 0;
  let missingPhoto = 0;
  const kept: HomeItem[] = [];

  for (const item of rows) {
    if (!item || typeof item.id !== "string") continue;
    if (hasMovedOn(item)) {
      movedOn += 1;
      continue;
    }
    total += 1;
    counts[shelfOf(item)] += 1;
    if (isMissingPhoto(item)) missingPhoto += 1;
    kept.push(item);
  }

  /**
   * `useMyInventory` already orders by created_at desc, but Home must not
   * depend on a caller's ordering for something a user will read as "latest".
   * Rows with no created_at sort last rather than jumping to the front.
   */
  const latest = [...kept]
    .sort((a, b) => {
      const at = a.created_at ? Date.parse(a.created_at) : NaN;
      const bt = b.created_at ? Date.parse(b.created_at) : NaN;
      const av = Number.isNaN(at) ? -Infinity : at;
      const bv = Number.isNaN(bt) ? -Infinity : bt;
      return bv - av;
    })
    .slice(0, latestCount);

  return {
    total,
    shelves: SHELF_ORDER.map((key) => ({
      key,
      label: SHELF_LABEL[key],
      count: counts[key],
    })),
    movedOn,
    missingPhoto,
    latest,
  };
}
