import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CHAMPAGNE, CLARET, HAIRLINE, MUTED } from "@/components/brand";
import { displayText } from "@/lib/displayText";

/**
 * Real things, actually on Loop, photographed by the people who own them.
 *
 * WHY THIS EXISTS. The landing page had no photographs at all. It got there
 * honestly — three AI-generated images were removed because generated
 * lifestyle imagery is the clearest "a machine made this" tell there is, and
 * one of them (four people laughing on a brownstone stoop) had a hand merging
 * into a camera and gibberish on the book spines. But removing them and
 * putting back nothing was half a job: a marketplace with no pictures of
 * anything is a worse page than one with mediocre pictures.
 *
 * The answer was never stock. It is that Alexandra already has the best
 * possible photographs and they were sitting unused in her own database: 12
 * of the 14 public listings have real photos, taken on a phone, in real
 * apartments, in real daylight. One has the photographer reflected in an
 * espresso machine's screen. No stock library sells that, and no image
 * generator can fake it, because what it is selling is that a real person two
 * floors up owns this thing.
 *
 * It reads live, so it can never go stale and can never be a lie about what
 * is on Loop. If the query returns nothing the section does not render at
 * all — an empty shelf is worse than no shelf, and inventing filler here
 * would break the promise the page itself makes further down ("Nothing here
 * is a guess").
 *
 * PRIVACY: this deliberately touches only `inventory_items` and never
 * `profiles`. It shows the thing, not its owner — no names, no avatars, no
 * neighbourhood. These are listings their owners already chose to make
 * public, and nothing here identifies who they belong to.
 */

type Listing = {
  id: string;
  name: string | null;
  brand: string | null;
  image_urls: string[] | null;
  rent_price: number | null;
  rent_window: string | null;
  sharing_price: number | null;
  is_for_borrow: boolean | null;
};

/**
 * How the owner priced it. NOT a guess.
 *
 * This said "/ week" for every rental, hardcoded. Every rental in the
 * database is priced per DAY, so the shop window advertised the workout
 * bench at "$50 / week" when its owner is asking $50 a day — a sevenfold
 * understatement, on the page that promises "Nothing here is a guess".
 *
 * An unrecognised window renders no period at all rather than falling back
 * to a day, for the reason the app's own rentWindow.ts gives: defaulting to
 * day is the OVERCHARGING direction, and a wrong price is worse than a
 * missing one in both directions.
 */
const WINDOW_LABEL: Record<string, string> = {
  day: "a day",
  weekend: "a weekend",
  week: "a week",
  month: "a month",
  event: "an event",
};

/**
 * Is this thing actually on offer to anybody?
 *
 * The app's own visibility rule requires it (isItemVisible's requireOffered),
 * and this band has to apply it too. Without it the fallthrough below labelled
 * every price-less row "Free to borrow" — which put "Macbook pro · Free to
 * borrow" in the shop window when its owner had offered it to nobody. Three
 * of the fourteen public rows were in that state. A flat untruth, on the one
 * page that promises "Nothing here is a guess".
 */
function isOffered(it: Listing): boolean {
  return (
    (it.rent_price != null && it.rent_price > 0) ||
    (it.sharing_price != null && it.sharing_price > 0) ||
    it.is_for_borrow === true
  );
}

/**
 * One price grammar, three forms, nothing else.
 *
 * This previously had a fourth form, `was $1500`, falling back to the
 * original purchase price. In a shop window that reads as a price-drop on a
 * second-hand laptop, which is neither what Loop is nor what the owner
 * offered — the original price is what THEY paid, not what you would. It
 * also sat next to "$9 / weekend" and "$150", so four different sentences
 * were competing in one grid. Now: rent, buy, or free to borrow.
 */
function priceLabel(it: Listing): string {
  if (it.rent_price != null && it.rent_price > 0) {
    const per = WINDOW_LABEL[(it.rent_window ?? "").toLowerCase()];
    const amount = `$${Math.round(it.rent_price)}`;
    return per ? `${amount} ${per}` : amount;
  }
  if (it.sharing_price != null && it.sharing_price > 0)
    return `$${Math.round(it.sharing_price)} to buy`;
  // Only reachable for rows where isOffered() already returned true, i.e.
  // is_for_borrow is genuinely set. Never a fallthrough.
  return "Free to borrow";
}

export function RealListings() {
  const [items, setItems] = useState<Listing[] | null>(null);
  /* A row can name a photo that no longer exists in storage. The browser
     then draws its broken-image glyph, which looks worse on a landing page
     than having one fewer thing. We cannot know which URLs are dead without
     fetching them, so we let the browser tell us and drop those tiles. */
  const [broken, setBroken] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, brand, image_urls, rent_price, rent_window, sharing_price, is_for_borrow")
        .eq("sharing_level", "public")
        .eq("is_available_for_sharing", true)
        .not("is_sold", "is", true)
        .not("is_eliminated", "is", true)
        .order("created_at", { ascending: false })
        .limit(24);
      /* Deliberately not filtered to borrowable-only in the query: the set
         is small, and an empty shelf is worse than a mixed one. The sort
         below does the preferring instead, so the band degrades gracefully
         as inventory grows or shrinks. */

      if (cancelled) return;
      if (error) {
        /* Render nothing rather than an error. This is a marketing band on
           a public page; a visitor should never be shown our plumbing. */
        setItems([]);
        return;
      }
      /* The product's own rule: a thing without a photograph is not visible.
         Enforced here too, so this band can never show an empty grey box. */
      const usable = ((data ?? []) as Listing[]).filter((it) => {
          if (!Array.isArray(it.image_urls) || it.image_urls.length === 0)
            return false;
          /* "Untitled item" is a real row in the database and a bad thing
             to put on a shop window. displayText already strips the literal
             string "null", which this table genuinely contains. */
          const n = displayText(it.name);
          if (!n || /^untitled\b/i.test(n)) return false;
          // Offered to somebody, or it has no business being in the window.
          if (!isOffered(it)) return false;
          return true;
      });
      /* Put the things you would actually borrow first. A MacBook and a
         monitor in the window quietly contradict "the stuff you only need
         for a while", so anything offered to rent or borrow outranks
         anything that is only for sale. Stable within each group. */
      const borrowable = (it: Listing) =>
        (it.rent_price != null && it.rent_price > 0) ||
        !(it.sharing_price != null && it.sharing_price > 0);
      usable.sort((a, b) => Number(borrowable(b)) - Number(borrowable(a)));
      setItems(usable);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing yet, or nothing to show: render nothing at all.
  if (!items || items.length === 0) return null;

  /* Six, not eight: two rows of three reads as a considered selection,
     where eight read as whatever happened to be in the database. */
  const shown = items.filter((it) => !broken.has(it.id)).slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <section style={{ background: CHAMPAGNE }} className="px-5 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-medium leading-tight"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            On Loop <span className="italic" style={{ color: CLARET }}>right now</span>
          </h2>
          <p className="max-w-sm text-sm" style={{ color: MUTED }}>
            Real things in real apartments, photographed by the people who
            own them. No stock, nothing generated.
          </p>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((it) => {
            const name = displayText(it.name) ?? "Something useful";
            const brand = displayText(it.brand);
            const src = it.image_urls?.[0];
            return (
              <li
                key={it.id}
                className="overflow-hidden rounded-2xl"
                style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}` }}
              >
                <div className="aspect-square w-full overflow-hidden" style={{ background: HAIRLINE }}>
                  <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={() =>
                      setBroken((prev) => {
                        const next = new Set(prev);
                        next.add(it.id);
                        return next;
                      })
                    }
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-[14px] font-semibold leading-snug">{name}</p>
                  {brand && (
                    <p className="truncate text-[12px]" style={{ color: MUTED }}>
                      {brand}
                    </p>
                  )}
                  <p
                    className="mt-1.5 text-[12px] font-semibold tabular-nums"
                    style={{ color: CLARET }}
                  >
                    {priceLabel(it)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* The band proves Loop is real, then used to dead-end. Browsing is
            open to signed-out visitors (see PublicProfile), so the one piece
            of evidence on the page should be reachable from it. */}
        <div className="mt-8">
          <Link
            to="/community"
            className="text-[15px] font-semibold hover:opacity-70"
            style={{ color: CLARET }}
          >
            See everything on Loop &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
