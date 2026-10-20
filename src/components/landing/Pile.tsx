/**
 * The three emotional beats of the landing page, as components.
 *
 * ── WHY THERE IS NO ILLUSTRATION HERE ──────────────────────────────────
 *
 * The brief was a person sitting in a heap of everything they own, with
 * price tags and "you could rent this" on each thing. The obvious build is
 * a hand-drawn pile of objects. Four independent concept passes all landed
 * on exactly that, and every reviewer flagged the same failure: the whole
 * page's colour and charm would live inside one illustration asset, and if
 * that asset reads even slightly clip-arty the page is dead. Loop's
 * founder has already rejected imagery twice on precisely those grounds —
 * literal stock photography came back "kind of gross", and a desaturated
 * treatment got "I didn't say white and boring, I want it colorful,
 * cheerful, CHIC".
 *
 * So the colour is STRUCTURAL instead. Each thing is a tile in the colour
 * the thing actually is — a terracotta Dutch oven, a pale-blue espresso
 * machine, an oat cable-knit — with its name set in type and a real price
 * tag pinned to it. Nothing is drawn, so nothing can be badly drawn, and
 * the page is colourful because the stuff is colourful. The chrome stays
 * paper-and-claret, which is the brand.
 *
 * ── WHY THE TAGS ARE VISIBLE BEFORE ANYTHING MOVES ────────────────────
 *
 * Every tag and chip is in the DOM at full opacity. The cascade is an
 * entrance, not a reveal: it only plays under
 * `prefers-reduced-motion: no-preference`, and it animates FROM a
 * transformed state TO the resting one. A shared link's preview image, a
 * screenshot, a reader with motion off and a browser with JS broken all
 * get the finished frame. A page whose content waits on an observer shows
 * nothing in the one frame that gets shared.
 *
 * ── WHAT THE NUMBERS ARE ───────────────────────────────────────────────
 *
 * Illustrative, and labelled as illustrative. They are a plausible
 * household, not anyone's data, and the page says so in the one place it
 * matters. Loop's own rule — Insights.tsx holds the long version — is that
 * a figure states what it is out of and never presents an estimate as
 * fact, so: prices here are what someone paid, the page never implies a
 * resale value, and the hours are a division the visitor can see and
 * change.
 */
import { useEffect, useMemo, useRef, useState } from "react";

const CLARET = "#8C2E48";
const INK = "#1B1917";
const HAIRLINE = "#E5E1DC";
const MUTED = "#5F5A54";
const FAINT = "#99938C";

/* The things, in their own colours. Ordinary objects a person in FiDi
   plausibly owns — chosen because each has an obvious colour, so the grid
   is cheerful without a single drawing. `rent` is null where lending it
   free is the natural offer. */
type Thing = {
  name: string;
  paid: number | null;
  rent: string | null;
  fill: string;
  ink?: string;
};

const THINGS: Thing[] = [
  { name: "Dutch oven", paid: 240, rent: "$9 / weekend", fill: "#C65A33" },
  { name: "Stand mixer", paid: 449, rent: "$12 / weekend", fill: "#E8C45C", ink: INK },
  { name: "Steam cleaner", paid: 180, rent: "$15 / day", fill: "#2E6F6B" },
  { name: "Cable-knit throw", paid: 95, rent: null, fill: "#E7DCC6", ink: INK },
  { name: "Espresso machine", paid: 320, rent: "$10 / day", fill: "#9FC2D6", ink: INK },
  { name: "Suitcase, large", paid: 210, rent: "$14 / week", fill: "#3E4C7A" },
  { name: "Folding table", paid: 60, rent: "$8 / event", fill: "#8A8F76" },
  { name: "Sewing machine", paid: 275, rent: "$11 / week", fill: "#7E4A6B" },
  { name: "Camping tent", paid: 249, rent: "$12 / weekend", fill: "#4F7F4A" },
  { name: "Tote bag", paid: null, rent: null, fill: "#D8A48F", ink: INK },
  { name: "Power drill", paid: 179, rent: "$8 / day", fill: "#D9823B" },
  { name: "Air fryer", paid: 130, rent: "$9 / weekend", fill: "#B9443F" },
];

/* The total says what it is out of, because two of the twelve have no
   price. A blank is not a zero — that rule is load-bearing across this
   codebase and it is the thing the page is really selling. */
const PRICED = THINGS.filter((t) => t.paid !== null);
const PILE_TOTAL = PRICED.reduce((sum, t) => sum + (t.paid ?? 0), 0);
const PILE_PRICED_COUNT = PRICED.length;
const PILE_COUNT = THINGS.length;

/** Plays an entrance once, and only when the reader hasn't asked for calm. */
function useEntrance() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!calm || calm.matches) {
      /* Reduced motion means GO STRAIGHT TO THE FINISHED STATE, not stay in
         the starting one. The first version returned here without setting
         `on`, so with motion off the strike-through never drew, the hour
         marks stayed squashed to 40% and every tile sat 10px low forever.
         `on` is "finished", not "animating". */
      setOn(true);
      return;
    }
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

/* A paper price tag. The thread is a 1px rule rather than a drawn string —
   the detail that makes it read as a tag is the notch and the punch hole,
   and both are CSS. */
function Tag({
  children,
  tone = "paid",
}: {
  children: React.ReactNode;
  tone?: "paid" | "rent" | "blank";
}) {
  const bg = tone === "rent" ? CLARET : "#FFFFFF";
  const fg = tone === "rent" ? "#FFFFFF" : tone === "blank" ? FAINT : INK;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-[3px] text-[11px] font-semibold tabular-nums"
      style={{
        background: bg,
        color: fg,
        border: tone === "rent" ? `1px solid ${CLARET}` : `1px solid ${HAIRLINE}`,
        borderStyle: tone === "blank" ? "dashed" : "solid",
        boxShadow: tone === "rent" ? "none" : "0 1px 2px rgba(27,25,23,0.06)",
        letterSpacing: "0.01em",
      }}
    >
      <span
        aria-hidden
        className="inline-block h-[4px] w-[4px] rounded-full"
        style={{ background: tone === "rent" ? "rgba(255,255,255,0.75)" : HAIRLINE }}
      />
      {children}
    </span>
  );
}

/**
 * BEAT A — the pile. Everything you own, each thing wearing what it cost
 * and what it could earn.
 */
export function Pile() {
  const { ref, on } = useEntrance();
  return (
    <div ref={ref}>
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))" }}
      >
        {THINGS.map((t, i) => (
          <div
            key={t.name}
            className="relative overflow-hidden rounded-2xl p-3"
            style={{
              background: t.fill,
              aspectRatio: "1 / 1.08",
              /* The entrance: from slightly low and small, to rest.
                 `on` false IS the resting state, so nothing is hidden. */
              transform: on ? "none" : "translateY(10px) scale(0.985)",
              opacity: on ? 1 : 1,
              transition: "transform 520ms cubic-bezier(.2,.8,.2,1)",
              transitionDelay: `${i * 34}ms`,
            }}
          >
            <p
              className="text-[12.5px] font-semibold leading-tight"
              style={{ color: t.ink ?? "#FFFFFF", maxWidth: "11ch" }}
            >
              {t.name}
            </p>
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
              {t.paid !== null ? (
                <Tag>${t.paid}</Tag>
              ) : (
                <Tag tone="blank">no price</Tag>
              )}
              {t.rent ? <Tag tone="rent">{t.rent}</Tag> : null}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-5" style={{ color: MUTED }}>
        ${PILE_TOTAL.toLocaleString()} across the {PILE_PRICED_COUNT} of{" "}
        {PILE_COUNT} that have a price. The other two are blank, not zero.
        <span style={{ color: FAINT }}> An example — not your data.</span>
      </p>
    </div>
  );
}

/**
 * BEAT B — the fifth one. Four of the same thing, three of which you forgot,
 * and the one you were about to buy.
 */
export function FifthOne() {
  const { ref, on } = useEntrance();
  const owned = [1, 0.34, 0.24, 0.16];
  return (
    /* One row, always. Wrapping put the fifth on its own line, which
       destroys the only thing this picture says: four, then a fifth. */
    <div
      ref={ref}
      className="flex items-end gap-2.5 overflow-x-auto pb-1 sm:gap-4"
    >
      {owned.map((o, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-2">
          <div
            className="shrink-0 rounded-xl"
            style={{
              /* Five shapes have to fit a 375px phone minus a 40px gutter,
                 or the row scrolls and "the one you remember" is cut off —
                 which is the label that makes the picture make sense. */
              width: "clamp(42px, 11.5vw, 64px)",
              height: "clamp(52px, 14vw, 78px)",
              background: "#D8A48F",
              opacity: o,
              transform: on ? "none" : "translateY(8px)",
              transition: "transform 460ms cubic-bezier(.2,.8,.2,1)",
              transitionDelay: `${i * 70}ms`,
            }}
          />
          <span className="text-[11px]" style={{ color: i === 0 ? INK : FAINT }}>
            {i === 0 ? "the one you remember" : " "}
          </span>
        </div>
      ))}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div
          className="relative shrink-0 rounded-xl"
          style={{
            width: "clamp(42px, 11.5vw, 64px)",
            height: "clamp(52px, 14vw, 78px)",
            border: `2px dashed ${CLARET}`,
            background: "transparent",
          }}
        >
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 block"
            style={{
              /* Spans the shape's own diagonal, so it keeps covering it
                 at every size. */
              width: on ? "132%" : "0%",
              height: 2,
              background: CLARET,
              transform: "translate(-50%,-50%) rotate(-24deg)",
              transformOrigin: "center",
              transition: "width 520ms cubic-bezier(.2,.8,.2,1)",
              transitionDelay: "420ms",
            }}
          />
        </div>
        <span className="text-[11px] font-semibold" style={{ color: CLARET }}>
          the fifth one
        </span>
      </div>
    </div>
  );
}

/**
 * BEAT C — hours, not dollars.
 *
 * The honesty problem and its solution: Loop does not know what anyone's
 * hour is worth, and a page that quietly assumed a wage would be inventing
 * the most personal number on it. So the rate is a real input, inside the
 * sentence, pre-filled with a stated placeholder, and every figure follows
 * it. The division is printed in full — total, divided by rate, equals
 * hours — so the arithmetic is checkable rather than asserted. This is the
 * same rule as the rest of the product: show the denominator.
 */
export function Hours() {
  const [rate, setRate] = useState(32);
  const hours = useMemo(
    () => (rate > 0 ? Math.round(PILE_TOTAL / rate) : 0),
    [rate]
  );
  const days = useMemo(() => (hours / 8).toFixed(1), [hours]);
  const { ref, on } = useEntrance();

  return (
    <div ref={ref}>
      <p
        className="text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.25]"
        style={{ fontFamily: "Instrument Serif, Georgia, serif", color: INK }}
      >
        You take home about{" "}
        <span className="whitespace-nowrap">
          $
          <input
            type="number"
            min={1}
            max={999}
            value={rate}
            onChange={(e) => {
              const n = Number(e.target.value);
              setRate(Number.isFinite(n) && n > 0 ? Math.min(999, n) : 1);
            }}
            aria-label="What you take home per hour, after tax"
            className="loop-rate w-[3.2em] bg-transparent text-center outline-none"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              color: CLARET,
              borderBottom: `2px solid ${CLARET}`,
              /* Spinner arrows look like a form control dropped into a
                 serif sentence. The field is still a number input, so
                 phones get the numeric keypad. */
              MozAppearance: "textfield",
              appearance: "textfield",
            }}
          />
        </span>{" "}
        an hour.
      </p>
      <p className="mt-2 text-[13px]" style={{ color: MUTED }}>
        Your number — change it. $32 is a placeholder, not a guess about you.
      </p>

      <p
        className="mt-7 text-[clamp(2rem,6vw,3.4rem)] leading-[1.05]"
        style={{ fontFamily: "Instrument Serif, Georgia, serif", color: INK }}
      >
        So this pile cost you{" "}
        <span className="italic tabular-nums" style={{ color: CLARET }}>
          {hours.toLocaleString()} hours
        </span>
        .
      </p>
      <p className="mt-3 text-[15px]" style={{ color: MUTED }}>
        ${PILE_TOTAL.toLocaleString()} ÷ ${rate} = {hours.toLocaleString()}{" "}
        hours. About {days} working days you don't get back.
      </p>

      {/* One mark per hour, up to a readable cap. Marks rather than a bar
          because a bar is a quantity and marks are a tally — you can feel
          yourself counting them, which is the point. */}
      <div
        className="mt-6 flex flex-wrap gap-[3px]"
        aria-hidden
        style={{ maxWidth: 560 }}
      >
        {Array.from({ length: Math.min(hours, 240) }).map((_, i) => (
          <span
            key={i}
            className="block"
            style={{
              width: 2,
              height: 16,
              background: CLARET,
              opacity: on ? 0.55 : 0.55,
              transform: on ? "none" : "scaleY(0.4)",
              transformOrigin: "bottom",
              transition: "transform 420ms ease-out",
              transitionDelay: `${Math.min(i * 3, 700)}ms`,
            }}
          />
        ))}
        {hours > 240 ? (
          <span className="ml-2 self-end text-[11px]" style={{ color: FAINT }}>
            + {(hours - 240).toLocaleString()} more
          </span>
        ) : null}
      </div>

      <p className="mt-6 text-[15px] leading-6" style={{ color: INK }}>
        You can't un-work those hours. You can stop spending more of them on
        things you already own.
      </p>
    </div>
  );
}

/* ── The nouns that cycle in the headline ─────────────────────────────
   Specific, ordinary, and plural, because "four umbrellas" is a joke you
   recognise and "four items" is a category. The cycle makes it universal
   without a paragraph explaining that it isn't really about umbrellas.

   `four` never moves: the swapping noun lives in an inline-block whose
   min-width is locked to the longest word, so nothing reflows mid-read.
   Under prefers-reduced-motion it simply stops on the first one. */
const NOUNS = [
  "umbrellas",
  "tote bags",
  "phone chargers",
  "black leggings",
  "water bottles",
  "half-burnt candles",
];

export function OwnFour() {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!calm || calm.matches) return;
    const t = window.setInterval(() => {
      setFade(true);
      window.setTimeout(() => {
        setI((n) => (n + 1) % NOUNS.length);
        setFade(false);
      }, 220);
    }, 2600);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span
      className="inline-block align-baseline italic"
      style={{
        color: CLARET,
        /* Locked to the longest noun so "four" cannot shift. */
        minWidth: "11.5ch",
      }}
    >
      <span
        style={{
          display: "inline-block",
          opacity: fade ? 0 : 1,
          transform: fade ? "translateY(-3px)" : "none",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {NOUNS[i]}
      </span>
    </span>
  );
}

/* ── BEAT B, expanded: the repeats ────────────────────────────────────
   A count, never a verdict. The app's DuplicateAlertBanner already holds
   this line — the number is the finding, what to do about it is the
   owner's call — so there is no "you don't need these" anywhere here. The
   parenthetical is the recognition: it is where the thing actually is. */
/* The label is written out, not pluralised by code. A `+ "s"` rule
   produced "4 black leggingss", because some of these nouns are already
   plural and English does not care what your data model wants. */
const REPEATS: { count: number; label: string; where: string; fill: string }[] = [
  { count: 4, label: "umbrellas", where: "three in the hall closet", fill: "#3E4C7A" },
  { count: 5, label: "phone chargers", where: "one in every bag", fill: "#E8C45C" },
  { count: 4, label: "pairs of black leggings", where: "two are the same pair", fill: "#2B2A28" },
  { count: 6, label: "tote bags", where: "from conferences", fill: "#D8A48F" },
  { count: 4, label: "candles", where: "all half-burnt", fill: "#C65A33" },
  { count: 3, label: "corkscrews", where: "none in the drawer", fill: "#2E6F6B" },
];

export function Repeats() {
  return (
    <div
      className="flex snap-x gap-3 overflow-x-auto pb-2"
      style={{ scrollbarWidth: "thin" }}
    >
      {REPEATS.map((r) => (
        <div
          key={r.label}
          className="shrink-0 snap-start rounded-2xl p-4"
          style={{
            width: 212,
            background: "#FFFFFF",
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          {/* The count, shown rather than stated: N swatches fanned. */}
          <div className="flex h-[58px] items-end gap-1">
            {Array.from({ length: r.count }).map((_, i) => (
              <span
                key={i}
                className="block rounded-md"
                style={{
                  width: 22,
                  height: 46 - i * 2,
                  background: r.fill,
                  opacity: i === 0 ? 1 : 0.9 - i * 0.14,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-[15px] font-semibold" style={{ color: INK }}>
            <span className="tabular-nums" style={{ color: CLARET }}>
              {r.count}
            </span>{" "}
            {r.label}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: FAINT }}>
            {r.where}
          </p>
        </div>
      ))}
    </div>
  );
}
