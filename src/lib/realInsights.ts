/**
 * realInsights — what src/lib/mockInsights.ts was pretending to be.
 *
 * WHAT WAS THERE BEFORE. mockInsights.ts holds a hardcoded list:
 *
 *   { match: "macbook",    label: "12 people want this" }
 *   { match: "kitchenaid", label: "8 people want this"  }
 *
 * and a fixed set of "duplicate groups" carrying invented resale values
 * ("3 cameras detected", estResaleValue: 220). InventoryPickleView imported
 * both WITHOUT a demo-mode guard, so a real signed-in user who happened to
 * own a MacBook was shown "12 people want this" as though it were a fact
 * about their neighbourhood. It was a number from a file.
 *
 * Nothing in here invents anything. Duplicates are counted from the user's
 * own rows; demand is counted from open item_requests — the same table the
 * mobile app's Wants tab reads — and comes back as zero when nobody has
 * asked for anything, which is currently the honest answer.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: if a number cannot be derived from
 * a row in the database, it does not go on screen. An insight screen that
 * is caught inventing one figure loses the reader for all the others, and
 * they will never tell you why they stopped believing it.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchWant, tokenize } from "@/lib/wantMatch";

// ─── Duplicates ────────────────────────────────────────────────────────

export type DuplicatePile = {
  /** The normalised name every member shares. */
  key: string;
  /** The name as the user actually typed it on the first item. */
  label: string;
  count: number;
  /** Lowercased names, for the existing highlight-and-scroll behaviour. */
  terms: string[];
};

/* `name` is optional AND nullable because that is what the body already
   accepts (`it?.name ?? ""`, then `continue` on blank) and what the column
   actually is — inventory_items.name is nullable. Declaring it required
   only forced every caller to launder real rows through `as any`, which
   is how a type stops catching anything. */
type NamedItem = { id?: string; name?: string | null };

/**
 * Things the user owns more than one of, by name.
 *
 * Deliberately NOT the scoring matcher in src/lib/duplicateDetection.ts —
 * that one weighs brand, colour and size, needs its own round trip, and
 * also carries the `.eq("is_sold", false)` NULL bug. For a headline count
 * on a dashboard, "you have typed this name more than once" is both
 * defensible and explainable, which a similarity score is not.
 */
export function groupDuplicates(items: NamedItem[] | null | undefined): DuplicatePile[] {
  const buckets = new Map<string, { label: string; terms: string[] }>();
  for (const it of items ?? []) {
    const raw = (it?.name ?? "").trim();
    if (!raw) continue;
    // Tokenised + sorted, so "blue yoga mat" and "yoga mat blue" land together.
    const key = tokenize(raw).map((t) => t).sort().join(" ");
    if (!key) continue;
    const b = buckets.get(key) ?? { label: raw, terms: [] };
    b.terms.push(raw.toLowerCase());
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .filter(([, b]) => b.terms.length > 1)
    .map(([key, b]) => ({ key, label: b.label, count: b.terms.length, terms: b.terms }))
    .sort((a, b) => b.count - a.count);
}

// ─── Demand ────────────────────────────────────────────────────────────

export type OpenWant = { id: string; itemName: string };

/**
 * Every open ask on Loop, newest first.
 *
 * Not scoped to the viewer's area: the network is small enough that a
 * geographic filter would usually return nothing, and the mobile app's
 * useTopWants made the same call for the same reason. Revisit when there
 * is density to filter by.
 */
export function useOpenWants() {
  return useQuery({
    queryKey: ["open-wants-all"],
    staleTime: 120_000,
    queryFn: async (): Promise<OpenWant[]> => {
      const { data, error } = await (supabase as any)
        .from("item_requests")
        .select("id, item_name, status")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as any[])
        .map((r) => ({ id: r.id as string, itemName: (r.item_name ?? "").toString() }))
        .filter((w) => w.itemName.trim() !== "");
    },
  });
}

/**
 * How many open asks this one item could answer. Zero is the common case
 * and is not a failure — it means nobody has asked for one.
 *
 * Returns a COUNT, never a label like "high demand". The old mock said
 * "High demand nearby" for anything containing "patagonia", which is the
 * kind of claim that cannot be checked and therefore should not be made.
 */
export function wantsMatching(itemName: string, wants: OpenWant[] | undefined): number {
  if (!wants?.length) return 0;
  let n = 0;
  for (const w of wants) {
    if (matchWant(w.itemName, [{ id: w.id, name: itemName }]).length > 0) n += 1;
  }
  return n;
}

/** Items of the viewer's that could answer at least one open ask. */
export function itemsWanted<T extends NamedItem>(
  items: T[] | null | undefined,
  wants: OpenWant[] | undefined
): T[] {
  if (!wants?.length) return [];
  return (items ?? []).filter((i) => wantsMatching(i.name, wants) > 0);
}
