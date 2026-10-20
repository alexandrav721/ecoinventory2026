/**
 * coverage — every number on an insights screen states what it is out of.
 *
 * WHY THIS EXISTS. Loop's most interesting columns are its emptiest ones.
 * original_price and purchase_date are nullable and most people never fill
 * them in; usage_frequency and love_rating are optional one-time answers.
 * An analytics screen built straight onto those columns computes a figure
 * from whatever fraction happened to be filled and presents it as a fact
 * about the whole collection.
 *
 * That is how "$2,847 of stuff" gets on a dashboard when the real statement
 * is "the sum of the two prices you typed in". The existing code does it in
 * three places with `(item.original_price || 0)` — an unknown silently
 * becomes a zero, which drags every average down and every total up.
 *
 * ── THE RULE ───────────────────────────────────────────────────────────
 *
 *   A figure computed from a partly-filled column is shown with:
 *     1. its denominator  — "across the 4 of 23 you priced"
 *     2. the unknowns, visibly — never folded into zero, never dropped
 *
 * Unknown is a third category, not an absence. A screen that is caught
 * inventing one number loses the reader for all the others, and they will
 * never tell you why they stopped believing it.
 *
 * This file does not decide what is worth showing. It makes it impossible
 * to show a figure without also knowing how much of the collection it
 * actually describes — `Coverage.known` is required to render the caption,
 * so the caption cannot be forgotten.
 */

export type Coverage = {
  /** Rows that carry a usable value. */
  known: number;
  /** Rows that do not. Shown, never silently dropped. */
  unknown: number;
  /** known + unknown. */
  total: number;
  /** 0–1. Zero when there is nothing at all. */
  ratio: number;
  /**
   * True when the figure describes so little of the collection that leading
   * with it would mislead. The threshold is a judgement, not a law: below
   * half, "most of your things aren't counted here" is the more honest
   * headline than the number itself.
   */
  thin: boolean;
};

export function coverageOf<T>(
  rows: T[] | null | undefined,
  hasValue: (row: T) => boolean
): Coverage {
  const all = rows ?? [];
  let known = 0;
  for (const r of all) {
    try {
      if (hasValue(r)) known += 1;
    } catch {
      /* a malformed row counts as unknown rather than throwing the screen */
    }
  }
  const total = all.length;
  const unknown = total - known;
  const ratio = total === 0 ? 0 : known / total;
  return { known, unknown, total, ratio, thin: total > 0 && ratio < 0.5 };
}

/**
 * The caption that must sit under any figure derived from a partial column.
 *
 * Deliberately returns a STRING rather than a component, so it can't be
 * styled into invisibility — and deliberately never returns empty when
 * there are unknowns.
 */
export function coverageNote(c: Coverage, noun = "things"): string {
  if (c.total === 0) return `No ${noun} yet`;
  if (c.unknown === 0) return `All ${c.total} ${noun}`;
  return `${c.known} of ${c.total} ${noun} · ${c.unknown} not recorded`;
}

/** A number a user typed, or null. Treats 0 as a real answer, "" as not one. */
export function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Sum of a partial column, with its coverage.
 *
 * Returns the sum of the KNOWN values only, and the coverage beside it. It
 * cannot be called in a way that silently coerces unknowns to zero, which
 * is the bug this replaces.
 */
export function sumKnown<T>(
  rows: T[] | null | undefined,
  pick: (row: T) => unknown
): { sum: number; coverage: Coverage } {
  const all = rows ?? [];
  let sum = 0;
  const cov = coverageOf(all, (r) => numberOrNull(pick(r)) !== null);
  for (const r of all) {
    const n = numberOrNull(pick(r));
    if (n !== null) sum += n;
  }
  return { sum, coverage: cov };
}

/**
 * Self-reported values grouped by answer, with "not recorded" kept as its
 * own bucket rather than dropped.
 *
 * usage_frequency and love_rating are opinions somebody typed once, not
 * measurements. Callers are expected to say so in the copy; this at least
 * guarantees the silent majority stays visible in the chart.
 */
export function tally<T>(
  rows: T[] | null | undefined,
  pick: (row: T) => string | null | undefined,
  order: string[]
): { key: string; label: string; count: number; recorded: boolean }[] {
  const counts = new Map<string, number>();
  let missing = 0;
  for (const r of rows ?? []) {
    const v = (pick(r) ?? "").toString().trim().toLowerCase();
    if (!v) {
      missing += 1;
      continue;
    }
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const out = order.map((k) => ({
    key: k,
    label: k.charAt(0).toUpperCase() + k.slice(1),
    count: counts.get(k) ?? 0,
    recorded: true,
  }));
  // Anything the user typed that isn't in the known vocabulary.
  for (const [k, n] of counts) {
    if (!order.includes(k)) {
      out.push({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1), count: n, recorded: true });
    }
  }
  out.push({ key: "__unrecorded", label: "Not recorded", count: missing, recorded: false });
  return out;
}
