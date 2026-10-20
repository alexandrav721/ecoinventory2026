/**
 * Treats a stored placeholder string as what it actually is: nothing.
 *
 * The live database contains the literal four-character string "null" in
 * `size` (5 rows) and `brand` (1 row) among the shared items — not SQL
 * NULL, the word. Something upstream is writing `String(someNull)` rather
 * than leaving the column empty, so browse was rendering
 *
 *     NULL
 *     Decorative Storage Cabinet
 *     Size null · Jersey City, NJ
 *
 * A `value && <span>{value}</span>` guard cannot catch that, because the
 * string is truthy. This can.
 *
 * It is a DISPLAY fix and not a data fix. The rows are still wrong, and
 * the write path that produced them is still producing them; this only
 * stops the website repeating the mistake back to people. Correcting the
 * rows and finding the writer are separate jobs.
 *
 * Deliberately narrow: it matches only the exact placeholder words, after
 * trimming and case-folding. "Null" as a brand name is vanishingly
 * unlikely, but "None" is a real colour and "NA" is a real size, so
 * neither is on the list.
 */
const PLACEHOLDERS = new Set(["null", "undefined", "nan", "n/a"]);

/** The text to show, or null when there is nothing honest to show. */
export function displayText(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (PLACEHOLDERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}
