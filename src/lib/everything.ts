/**
 * everything — the band model behind the /everything screen.
 *
 * Pure: no React, no Supabase client, no React Native. That is deliberate
 * so the banding guarantees can be exercised directly in a test runner
 * rather than only through a mounted component — this is the computation
 * the whole screen rests on, and "every item appears exactly once" is not
 * something to find out in production.
 *
 * See src/hooks/useEverything.ts for the hook that wires it to data, and
 * app/everything.tsx for the rules the screen itself must keep.
 */
/* PORTED FROM THE MOBILE APP — ecoinventory-mobile/src/lib/everything.ts.
   Keep the banding logic identical; the only change permitted here is this
   type, because the website has no generated InventoryItem. It is
   structural on purpose: buildBands only ever reads these four fields, so
   anything carrying them can be banded. */
export type InventoryItem = {
  id: string;
  name?: string | null;
  color?: string | null;
  category_id?: string | null;
  image_urls?: string[] | null;
  [k: string]: unknown;
};

export type EverythingBand = {
  /** Stable list key. */
  key: string;
  /** The count, rendered large. */
  count: number;
  /** What the count is OF — "pillow shams", "Kitchen". Already plural-safe. */
  label: string;
  /** "duplicate" bands are the gasp; "category" bands are the completeness. */
  kind: "duplicate" | "category";
  /**
   * For duplicate bands: the normalised item name the group was built
   * from. Used to hand a pile to /declutter by name rather than by a URL
   * full of UUIDs — 41 candles would be a 1,500-character link.
   */
  nameKey?: string;
  items: InventoryItem[];
};

/**
 * Colour words ordered light→dark along a warm→cool spine. Deliberately a
 * fixed vocabulary rather than a parser: `color` is whatever the AI photo
 * reader or the user typed, and a lookup that misses simply sorts that item
 * to the end of its band. Lower rank paints first.
 */
const COLOR_RANK: Record<string, number> = {
  white: 0, ivory: 1, cream: 2, beige: 3, ecru: 3, oat: 4, sand: 5, tan: 6,
  camel: 7, yellow: 8, gold: 9, mustard: 10, orange: 11, rust: 12, coral: 13,
  red: 14, burgundy: 15, maroon: 16, claret: 16, pink: 17, blush: 18,
  rose: 19, purple: 20, lilac: 21, lavender: 22, violet: 23, navy: 24,
  blue: 25, denim: 26, teal: 27, turquoise: 28, mint: 29, green: 30,
  olive: 31, sage: 32, khaki: 33, brown: 34, chocolate: 35, taupe: 36,
  silver: 37, grey: 38, gray: 38, charcoal: 39, slate: 40, black: 41,
  multicolor: 42, multicolour: 42, clear: 43,
};

const UNKNOWN_COLOR = 999;

function colorRank(item: InventoryItem): number {
  const raw = ((item as any).color ?? "") as string;
  const key = raw.trim().toLowerCase();
  if (!key) return UNKNOWN_COLOR;
  if (key in COLOR_RANK) return COLOR_RANK[key];
  // "light blue", "dark navy", "off-white" — take the first word we know.
  for (const word of key.split(/[\s/-]+/)) {
    if (word in COLOR_RANK) return COLOR_RANK[word];
  }
  return UNKNOWN_COLOR;
}

/** Light→dark, then newest-first inside a colour so the order is stable. */
function byColor(a: InventoryItem, b: InventoryItem): number {
  const d = colorRank(a) - colorRank(b);
  if (d !== 0) return d;
  return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
}

/** "pillow sham" + 10 → "pillow shams". Leaves an existing plural alone. */
function pluralize(name: string, count: number): string {
  if (count === 1) return name;
  const n = name.trim();
  if (/(s|x|z|ch|sh)$/i.test(n)) return `${n}es`;
  if (/[^aeiou]y$/i.test(n)) return `${n.slice(0, -1)}ies`;
  return `${n}s`;
}

/** Minimum copies of one name before a pile is worth calling out. */
const DUPLICATE_MIN = 2;

/**
 * The banding, as a pure function, so it can be exercised without
 * mounting a component. The hook below is a thin wrapper over it.
 *
 * Guarantees, all covered by tests: every item appears in exactly one
 * band; duplicate bands precede category bands; both runs are
 * count-descending.
 */
export function buildBands(
  items: InventoryItem[] | undefined,
  allCategories: { id: string; name: string }[] | undefined
): EverythingBand[] {
  {
    if (!items || items.length === 0) return [];

    // ── 1. Duplicate-name bands ──────────────────────────────────────
    const byName = new Map<string, InventoryItem[]>();
    for (const it of items) {
      const key = (it.name ?? "").trim().toLowerCase();
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(it);
    }

    const out: EverythingBand[] = [];
    const claimed = new Set<string>();

    const dupes = Array.from(byName.values())
      .filter((group) => group.length >= DUPLICATE_MIN)
      .sort((a, b) => b.length - a.length);

    for (const group of dupes) {
      const name = (group[0].name ?? "").trim();
      for (const it of group) claimed.add(it.id);
      out.push({
        key: `dup-${group[0].id}`,
        count: group.length,
        label: pluralize(name, group.length).toLowerCase(),
        kind: "duplicate",
        nameKey: name.toLowerCase(),
        items: [...group].sort(byColor),
      });
    }

    // ── 2. Category bands for everything still unclaimed ─────────────
    const nameById = new Map<string, string>();
    for (const c of allCategories ?? []) nameById.set(c.id, c.name);

    const byCat = new Map<string, InventoryItem[]>();
    for (const it of items) {
      if (claimed.has(it.id)) continue;
      const key = it.category_id ?? "uncategorized";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(it);
    }

    const cats = Array.from(byCat.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );
    for (const [catId, group] of cats) {
      out.push({
        key: `cat-${catId}`,
        count: group.length,
        label: nameById.get(catId) ?? "everything else",
        kind: "category",
        items: [...group].sort(byColor),
      });
    }

    return out;
  }
}
