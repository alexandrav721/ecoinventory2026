/**
 * wantMatch — "do I already own what this neighbour is asking for?"
 *
 * PORTED FROM THE MOBILE APP — ecoinventory-mobile/src/lib/wantMatch.ts.
 * Keep the two copies identical. If the matching rule differs between the
 * app and the website, the same person gets two different answers to "can I
 * help with this?" depending on which screen they opened, and neither
 * number is trustworthy after that.
 *
 * WHY THIS IS CLIENT-SIDE AND PURE. The caller already holds the viewer's
 * inventory, so answering this costs nothing: no query, no RPC, no round
 * trip. There is already a
 * server RPC, get_want_match_counts, but it answers a different question —
 * how many people ACROSS LOOP could match a want, for the Wants feed. What
 * the Ask Board needs is the first-person version: can *you* help.
 *
 * ── THE RULE: NEVER CLAIM A MATCH, ONLY A CANDIDATE ────────────────────
 *
 * Name matching is a guess. "Stand mixer" against "KitchenAid Artisan"
 * fails; "paddle" matches both a pickleball paddle and a canoe paddle. So
 * nothing here returns "you have this." It returns things WORTH A LOOK, and
 * the UI must say so — "2 of your things might match" — because the cost of
 * a wrong guess is a neighbour being told no by someone who could have said
 * yes, or an awkward message about a canoe.
 *
 * Scoring is deliberately simple. A smarter matcher (embeddings, the
 * category_learning table, the brand catalogue) is a real option later, but
 * it needs a way to measure whether it is actually better, and there is no
 * such measurement yet. A transparent rule that a person can predict beats
 * an opaque one that is right slightly more often.
 */

/**
 * Words that carry no identifying signal. Dropping them stops "set" matching
 * every set and "the" matching everything.
 */
const STOPWORDS = new Set([
  "a", "an", "the", "of", "for", "and", "or", "with", "my", "your",
  "set", "kit", "pair", "piece", "pieces", "item", "items", "thing", "things",
  "new", "old", "used", "small", "large", "big", "mini",
  "some", "any", "one", "two",
]);

/** Lowercase, strip punctuation, split, drop stopwords and 1-char noise. */
export function tokenize(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Singular-ish form, so "paddles" matches "paddle" and "boxes" matches
 * "box". Deliberately crude — a real stemmer is not worth a dependency for
 * a name-overlap heuristic, and over-stemming produces worse false
 * positives than under-stemming.
 */
function stem(token: string): string {
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    const base = token.slice(0, -1);
    /* Strip the "e" as well only when it belongs to the plural, which is
       after a sibilant: boxes→box, dishes→dish, glasses→glass. Stripping it
       unconditionally turned "paddles" into "paddl", which then failed to
       match "paddle" — the exact case this function exists for. */
    if (base.endsWith("e") && /(s|x|z|ch|sh)$/.test(base.slice(0, -1))) {
      return base.slice(0, -1);
    }
    return base;
  }
  return token;
}

function stemmed(value: string | null | undefined): Set<string> {
  return new Set(tokenize(value).map(stem));
}

export type MatchableItem = {
  id: string;
  name?: string | null;
  brand?: string | null;
  description?: string | null;
  tags?: string[] | null;
  image_urls?: string[] | null;
  is_sold?: boolean | null;
  is_donated?: boolean | null;
};

export type WantMatch = {
  item: MatchableItem;
  /** How many of the want's significant words this item accounts for. */
  overlap: number;
  /** overlap / wantTokens — 1 means every word in the ask was found. */
  coverage: number;
};

/**
 * Items of the viewer's that are worth checking against one want.
 *
 * Matching runs against the item's NAME and BRAND only, not its description
 * or notes: a long description mentions many nouns in passing, and matching
 * on those produced the kind of nonsense result ("your sofa matches
 * 'carpet cleaner' because the description says carpet") that teaches people
 * to ignore the feature.
 */
export function matchWant(
  wantName: string | null | undefined,
  items: MatchableItem[] | null | undefined,
  opts: { limit?: number; minCoverage?: number } = {}
): WantMatch[] {
  const limit = opts.limit ?? 3;
  /* Half the words in the ask must be present. One word out of three is
     noise — "cleaner" alone should not surface a vacuum for a request
     about upholstery. */
  const minCoverage = opts.minCoverage ?? 0.5;

  const wantTokens = [...stemmed(wantName)];
  if (wantTokens.length === 0) return [];

  const out: WantMatch[] = [];
  for (const item of items ?? []) {
    if (!item || typeof item.id !== "string") continue;
    // Things you no longer have cannot help anybody.
    if (item.is_sold === true || item.is_donated === true) continue;

    const haystack = stemmed(`${item.name ?? ""} ${item.brand ?? ""}`);
    if (haystack.size === 0) continue;

    let overlap = 0;
    for (const t of wantTokens) if (haystack.has(t)) overlap += 1;
    if (overlap === 0) continue;

    const coverage = overlap / wantTokens.length;
    if (coverage < minCoverage) continue;
    out.push({ item, overlap, coverage });
  }

  return out
    .sort((a, b) => b.coverage - a.coverage || b.overlap - a.overlap)
    .slice(0, limit);
}
