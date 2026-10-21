/**
 * The brand, in one place.
 *
 * These were local to src/pages/Landing.tsx, which meant the sign-in page
 * — the surface a returning user sees most — drew its own badge instead: a
 * leaf glyph in a green gradient circle, left over from when this was an
 * eco-inventory product. Two different marks on the front door and the
 * door handle.
 *
 * The palette literals match ecoinventory-mobile/src/lib/tokens.ts, which
 * is the source of truth. They are literals rather than CSS custom
 * properties because the marketing and auth surfaces are styled inline
 * throughout; the signed-in app reads hsl(var(--…)) from src/index.css.
 * If the palette moves it moves in tokens.ts first, then here.
 */

export const PAPER = "#FFFFFF";
export const CLARET = "#8C2E48";
export const INK = "#1B1917";
export const CHAMPAGNE = "#F7F2EA";
export const HAIRLINE = "#E5E1DC";
export const MUTED = "#5F5A54";
export const FAINT = "#99938C";

/** The app mark — same geometry as the iOS icon. */
export function LoopMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <rect width="1024" height="1024" rx="230" fill={CLARET} />
      <path
        d="M 805 405 A 312 312 0 1 1 619 219"
        fill="none"
        stroke={CHAMPAGNE}
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M 380 326 L 380 698 L 658 698"
        fill="none"
        stroke={PAPER}
        strokeWidth="88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The wordmark, as it appears beside the mark. */
export function LoopWordmark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="italic leading-none"
      style={{ fontFamily: "Instrument Serif, Georgia, serif", fontSize: size }}
    >
      Loop
    </span>
  );
}

/** Mark and wordmark together — the lockup. */
export function LoopLockup({
  size = 30,
  type = 24,
}: {
  size?: number;
  type?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LoopMark size={size} />
      <LoopWordmark size={type} />
    </span>
  );
}
