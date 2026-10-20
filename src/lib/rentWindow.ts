/**
 * Rental windows — "$30 / weekend", not "$30".
 *
 * PORTED FROM THE MOBILE APP — ecoinventory-mobile/src/lib/rentWindow.ts.
 * Keep the two byte-identical below this header. This is the money module:
 * if the app and the website disagree about what a rent_price MEANS, one of
 * them shows a borrower a number they will not be charged. The server
 * re-derives every total in create-payment regardless, so a divergence here
 * does not steal money — it lies about the price, which is worse for trust
 * and harder to notice.
 *
 * Loop priced everything per DAY until June 2026. That was wrong for most of
 * what the app is actually for: a bassinet rents by the month, a tuxedo by the
 * event, a kayak by the day. `rent_price` is the price for ONE window, and
 * `rent_window` names the window.
 *
 * MONEY-SAFETY RULES — read before changing anything here:
 *
 *   1. `event` is FLAT. A $75/event tuxedo held for five days costs $75,
 *      because that is what the listing promised the borrower. Never multiply
 *      an event rate by elapsed days.
 *   2. An unrecognised window is NOT silently treated as "day". Defaulting to
 *      day OVERCHARGES (a $250/month item would bill $250 x 30). Unknown
 *      values resolve to null and callers must refuse to price rather than
 *      guess. This is why the DB column carries a CHECK constraint even
 *      though the codebase generally prefers client-side validation.
 *   3. The server re-derives every total independently in create-payment.
 *      Nothing here is trusted for what a borrower is actually charged; this
 *      module exists so the client SHOWS the same number the server will bill.
 */

/** The six windows. Matches the CHECK on inventory_items.rent_window. */
export const RENT_WINDOWS = [
  "day",
  "weekend",
  "week",
  "month",
  "season",
  "event",
] as const;

export type RentWindow = (typeof RENT_WINDOWS)[number];

/** The window Loop has always used, and the DB column default. */
export const DEFAULT_RENT_WINDOW: RentWindow = "day";

/**
 * Days each window spans, for converting a borrow range into a bill.
 * `event` is deliberately absent — it is flat, not duration-based. Reading it
 * from here would be a bug, so the type makes that impossible.
 */
const WINDOW_DAYS: Record<Exclude<RentWindow, "event">, number> = {
  day: 1,
  weekend: 3,
  week: 7,
  month: 30,
  season: 90,
};

/** Human label for the price suffix — "/ weekend", "/ event". */
const WINDOW_LABEL: Record<RentWindow, string> = {
  day: "day",
  weekend: "weekend",
  week: "week",
  month: "month",
  season: "season",
  event: "event",
};

/**
 * Longhand for pickers and explanatory copy.
 * Kept separate from WINDOW_LABEL so the terse price suffix and the
 * descriptive picker row can diverge without one breaking the other.
 */
export const WINDOW_DESCRIPTION: Record<RentWindow, string> = {
  day: "Per day — tools, bikes, anything borrowed for an afternoon",
  weekend: "Per weekend — camping and backyard gear",
  week: "Per week — trip gear and try-before-you-buy",
  month: "Per month — baby gear and recovery equipment",
  season: "Per season — holiday decor",
  event: "Per event — one night, however long you hold it",
};

/**
 * Narrow an untrusted string to a RentWindow.
 *
 * Returns null — never a fallback — when the value isn't recognised. See rule
 * 2 above: guessing "day" here would overcharge.
 */
export function asRentWindow(raw: unknown): RentWindow | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  return (RENT_WINDOWS as readonly string[]).includes(t)
    ? (t as RentWindow)
    : null;
}

/**
 * How many windows a borrow of `days` days is billed for.
 *
 * Partial windows round UP — holding a weekend item for 4 days is 2 weekends,
 * the same way every rental counter on earth works. Always at least 1.
 */
export function windowCount(days: number, window: RentWindow): number {
  if (window === "event") return 1; // flat, regardless of how long it's held
  const d = Math.max(1, Math.ceil(Number(days) || 1));
  return Math.max(1, Math.ceil(d / WINDOW_DAYS[window]));
}

/**
 * The total in cents for `days` at `rate` dollars per window.
 *
 * Cents are computed from the rate FIRST and then multiplied, so the result
 * is always a whole number of cents and matches the server's arithmetic
 * exactly. Doing it the other way round can round differently on a .5 and
 * produce a total the server rejects.
 */
export function rentalTotalCents(
  rateDollars: number,
  days: number,
  window: RentWindow
): number {
  const perWindow = Math.round((Number(rateDollars) || 0) * 100);
  return perWindow * windowCount(days, window);
}

/**
 * The most windows a single booking could legitimately cover, used as the
 * server's upper bound when there's no request row to check dates against.
 * A year of days is 366; a year of events is 1.
 */
export function maxWindowsPerYear(window: RentWindow): number {
  if (window === "event") return 1;
  return Math.ceil(366 / WINDOW_DAYS[window]);
}

/**
 * The longest booking that makes sense for a window, in days.
 *
 * Only `event` gets a tight cap, and only because it is FLAT-rate: without
 * one, someone could hold a $75/event tuxedo for six months and still pay
 * $75. That's real owner exposure — item detail enforces no maximum range at
 * all today.
 *
 * Every other window is duration-based, so a long booking simply costs
 * proportionally more and needs no protecting. They get a year, which is the
 * same effective ceiling the server has always applied. Capping them tighter
 * would BREAK bookings that work today — a 45-day borrow of a day-rate item
 * is perfectly legitimate and someone is probably mid-way through one.
 */
export function maxBookingDays(window: RentWindow): number {
  return window === "event" ? 7 : 366;
}

/**
 * "$30 / weekend", or "$30/weekend" in compact mode for tight tiles.
 * Returns null when there's no real rate — callers render nothing rather
 * than a bare "$0".
 */
export function formatRentPrice(
  rateDollars: number | null | undefined,
  window: RentWindow | null | undefined,
  opts?: { compact?: boolean }
): string | null {
  const rate = Number(rateDollars ?? 0);
  if (!rate || rate <= 0) return null;
  const w = window ?? DEFAULT_RENT_WINDOW;
  const amount = Number.isInteger(rate) ? `$${rate}` : `$${rate.toFixed(2)}`;
  return opts?.compact
    ? `${amount}/${WINDOW_LABEL[w]}`
    : `${amount} / ${WINDOW_LABEL[w]}`;
}

/** Just the suffix — "/ weekend" — for callers that render the number apart. */
export function rentWindowSuffix(
  window: RentWindow | null | undefined
): string {
  return `/ ${WINDOW_LABEL[window ?? DEFAULT_RENT_WINDOW]}`;
}

/**
 * A plain-language line for the borrow sheet:
 *   "3 weekends x $30 = $90"
 * Returns null when there's nothing honest to say.
 */
export function explainRentalTotal(
  rateDollars: number | null | undefined,
  days: number,
  window: RentWindow | null | undefined
): string | null {
  const rate = Number(rateDollars ?? 0);
  if (!rate || rate <= 0) return null;
  const w = window ?? DEFAULT_RENT_WINDOW;
  const n = windowCount(days, w);
  const total = rentalTotalCents(rate, days, w) / 100;
  const unit = WINDOW_LABEL[w];
  const plural = n === 1 ? unit : `${unit}s`;
  if (w === "event") return `One event · $${total.toFixed(2)}`;
  return `${n} ${plural} × $${rate} = $${total.toFixed(2)}`;
}
