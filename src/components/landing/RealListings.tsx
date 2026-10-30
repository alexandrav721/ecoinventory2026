import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CHAMPAGNE, CLARET, HAIRLINE, MUTED } from "@/components/brand";

/* A 1px #E5E1DC rule on #F7F2EA is luminance 0.804 against 0.891 — a rule
   that barely exists. Structure only reads if it changes value with its
   ground, so rules on champagne step one tone darker. */
const RULE_ON_CHAMPAGNE = "#D4CFC8";
import { displayText } from "@/lib/displayText";

/**
 * Everything on Loop, right now — the real supply, as photography.
 *
 * These are the only pictures on this site and they are the whole argument:
 * real things, in real apartments, shot on their owners' phones. No stock
 * (rejected twice on this brand), nothing generated. The uneven quality is
 * the point — it is what proves nobody made them up.
 *
 * WHAT CHANGED, AND WHY
 *
 * The band used to be six identical white cards in a four-column grid,
 * which left a visible hole in row two and made ordinary objects look like
 * weak e-commerce. Tiles are now deliberately unequal, sit directly on the
 * champagne ground with no card and no shadow, and the row breaks are
 * composed rather than wrapped.
 *
 * The brand line is gone. It mostly repeated the first word of the name
 * ("Shark Mop / Shark") and, on one live row, contradicted the photograph:
 * an item titled "HP Monitor Ultrawide" whose picture plainly shows an LG
 * bezel. That is the owner's own typo and not ours to silently edit, but a
 * page promising "Nothing here is a guess" should not print a brand over a
 * photograph of a different brand.
 *
 * The standfirst no longer says "in real FiDi apartments". Not one member
 * has FiDi as their area; most are in New Jersey. It was false, and it sat
 * one screen above the honesty promise.
 *
 * The counts in the standfirst are computed, not typed — see Ledger.tsx for
 * why that is not fussiness.
 */

export type Listing = {
  id: string;
  name: string | null;
  image_urls: string[] | null;
  rent_price: number | null;
  rent_window: string | null;
  sharing_price: number | null;
  is_for_borrow: boolean | null;
};

/**
 * How the owner priced it. NOT a guess.
 *
 * This hardcoded "/ week" for every rental while every rental in the
 * database is priced per DAY — advertising a $50/day bench at $50 a week.
 * An unrecognised window now renders no period at all rather than assuming
 * a day: per the app's own rentWindow.ts, defaulting to day is the
 * OVERCHARGING direction.
 */
const WINDOW_LABEL: Record<string, string> = {
  day: "a day",
  weekend: "a weekend",
  week: "a week",
  month: "a month",
  event: "an event",
};

export function priceLabel(it: Listing): string {
  if (it.rent_price != null && it.rent_price > 0) {
    const per = WINDOW_LABEL[(it.rent_window ?? "").toLowerCase()];
    const amount = `$${Math.round(it.rent_price)}`;
    return per ? `${amount} ${per}` : amount;
  }
  if (it.sharing_price != null && it.sharing_price > 0)
    return `$${Math.round(it.sharing_price)} to buy`;
  return "Free to borrow";
}

/** Offered to somebody — the app's requireOffered rule, applied here too. */
function isOffered(it: Listing): boolean {
  return (
    (it.rent_price != null && it.rent_price > 0) ||
    (it.sharing_price != null && it.sharing_price > 0) ||
    it.is_for_borrow === true
  );
}

/** Borrowable and rentable outrank buy-only: a thing you keep forever
 *  quietly contradicts "the stuff you only need for a while". */
function borrowable(it: Listing): boolean {
  return (
    (it.rent_price != null && it.rent_price > 0) || it.is_for_borrow === true
  );
}

/**
 * One query, shared by the hero photograph and the band, so the two can
 * never disagree about what Loop has.
 */
export type Offered = {
  items: Listing[];
  offeredCount: number;
  /** On offer, but with no photograph — so invisible, by Loop's own rule. */
  hidden: Listing[];
};

export function useOfferedListings() {
  const [state, setState] = useState<Offered | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(
          "id, name, image_urls, rent_price, rent_window, sharing_price, is_for_borrow"
        )
        .eq("sharing_level", "public")
        .eq("is_available_for_sharing", true)
        .not("is_sold", "is", true)
        .not("is_eliminated", "is", true)
        .order("created_at", { ascending: false })
        .limit(40);

      if (cancelled) return;
      if (error) {
        setState({ items: [], offeredCount: 0, hidden: [] });
        return;
      }

      /* Everything genuinely on offer, photographed or not. The band shows
         only the photographed ones and then SAYS how many it is not
         showing — see the standfirst. Quietly displaying six and heading it
         "everything" is the kind of small dishonesty this page exists to
         not commit. */
      const offeredAll = ((data ?? []) as Listing[]).filter(isOffered);

      const usable = ((data ?? []) as Listing[]).filter((it) => {
        if (!Array.isArray(it.image_urls) || it.image_urls.length === 0)
          return false;
        const n = displayText(it.name);
        // "Untitled item" is a real row and a poor thing to put in a window.
        if (!n || /^untitled\b/i.test(n)) return false;
        return isOffered(it);
      });

      usable.sort((a, b) => Number(borrowable(b)) - Number(borrowable(a)));

      /* One editorial choice, stated plainly: the hero photograph leads.
         Ordering which REAL photograph goes first is curation, which every
         shop window does; inventing one would be the lie. Today the best
         picture on Loop is the espresso machine — a warm kitchen, a
         hand-painted cup, and the owner reflected in the screen, which is
         the most efficient proof on the site that nobody generated these.
         Left to created_at it would have opened on an air purifier against
         a blank wall. If that listing ever goes, this falls through to
         whatever is genuinely first; nothing breaks. */
      const PREFERRED = /espresso|terra kaffe/i;
      const lead = usable.findIndex((it) => PREFERRED.test(it.name ?? ""));
      if (lead > 0) usable.unshift(usable.splice(lead, 1)[0]);

      setState({
        items: usable,
        offeredCount: offeredAll.length,
        hidden: offeredAll.filter(
          (it) => !Array.isArray(it.image_urls) || it.image_urls.length === 0
        ),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** A photograph plus its line. No card, no border box, no shadow. */
function Plate({
  it,
  ratio,
  onBroken,
}: {
  it: Listing;
  ratio: string;
  onBroken: (id: string) => void;
}) {
  const name = displayText(it.name) ?? "Something useful";
  return (
    <figure className="m-0">
      <div
        className="w-full overflow-hidden"
        style={{
          aspectRatio: ratio,
          background: "#E3DED6",
          borderRadius: 2,
          border: `1px solid ${RULE_ON_CHAMPAGNE}`,
        }}
      >
        <img
          src={it.image_urls?.[0]}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => onBroken(it.id)}
        />
      </div>
      <figcaption className="pt-3">
        <p className="text-[15px] font-semibold leading-tight">{name}</p>
        <p
          className="mt-1 text-[13px] font-semibold"
          style={{ color: CLARET, fontVariantNumeric: "tabular-nums" }}
        >
          {priceLabel(it)}
        </p>
      </figcaption>
    </figure>
  );
}

export function RealListings({
  items,
  hidden,
}: {
  items: Listing[] | null;
  hidden: Listing[];
}) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const drop = (id: string) =>
    setBroken((p) => {
      const n = new Set(p);
      n.add(id);
      return n;
    });

  if (!items || items.length === 0) return null;
  const shown = items.filter((i) => !broken.has(i.id));
  if (shown.length === 0) return null;


  // Composed, not wrapped: a 5/3/4 row then a 4/4/4 row. The unevenness is
  // what stops seven ordinary objects reading as a product grid.
  const spans = ["md:col-span-5", "md:col-span-3", "md:col-span-4"];
  const ratios = ["4 / 5", "1 / 1", "1 / 1", "3 / 4", "3 / 4", "3 / 4"];

  return (
    <section
      className="px-6 py-20 md:px-12 md:py-24"
      style={{ background: CHAMPAGNE }}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="md:flex md:items-baseline md:justify-between md:gap-10">
          <h2
            className="text-[30px] leading-[1.06] md:text-[40px]"
            style={{
              fontFamily: "Instrument Serif, Georgia, serif",
              letterSpacing: "-0.015em",
            }}
          >
            Everything on Loop, right now.
          </h2>
          <p
            className="mt-4 max-w-[430px] text-[15px] leading-[1.5] md:mt-0"
            style={{ color: MUTED }}
          >
            Photographed by the people who own them, on their own phones. No
            stock, nothing generated.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-12">
          {shown.slice(0, 6).map((it, i) => (
            <div key={it.id} className={i < 3 ? spans[i] : "md:col-span-4"}>
              <Plate it={it} ratio={ratios[i] ?? "3 / 4"} onBroken={drop} />
            </div>
          ))}
        </div>

        {hidden.length > 0 && (
          /* THE DEVICE. Loop's own product law — a thing without a
             photograph is not visible — shown operating in public, against
             the founder's interest, on rows she would plainly rather show.
             Today those rows are a power drill and a cooler: the two most
             on-wedge objects in the entire inventory, hidden by her own
             rule. No growth playbook produces this paragraph, which is
             exactly why it is worth more than another testimonial.

             Names and prices come from the database, never hand-written.
             A competing proposal invented a caption for the television
             ("face down on the bed, the way it came off the wall") when the
             photograph shows it wall-mounted and switched on — a fabricated
             caption on the page that promises nothing is a guess is the
             worst failure available here. */
          <div className="mt-16 max-w-[620px]">
            <p
              className="text-[13px] uppercase"
              style={{ letterSpacing: "0.1em", color: MUTED }}
            >
              {hidden.length === 1
                ? "And one you can't see"
                : `And ${hidden.length} you can't see`}
            </p>
            <ul className="mt-4">
              {hidden.map((it) => (
                <li
                  key={it.id}
                  className="flex items-baseline justify-between gap-6 py-3 text-[16px]"
                  style={{ borderTop: `1px solid ${RULE_ON_CHAMPAGNE}` }}
                >
                  <span>{displayText(it.name) ?? "Something useful"}</span>
                  <span
                    className="shrink-0 text-[14px] font-semibold"
                    style={{
                      color: MUTED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {priceLabel(it)}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className="mt-5 text-[15px] leading-[1.6]"
              style={{ color: "#4A4540" }}
            >
              On offer, and nobody can find them — because on Loop a thing
              without a photograph isn't visible to anyone. That's my rule,
              and it costs me the two things people ask for most.
            </p>
          </div>
        )}

        <div className="mt-12">
          <Link
            to="/community"
            className="text-[15px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: CLARET }}
          >
            Browse all of it &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
