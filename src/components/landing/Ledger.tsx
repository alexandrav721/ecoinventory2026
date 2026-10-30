import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HAIRLINE, INK, MUTED } from "@/components/brand";

/**
 * Where Loop actually is, today — counted live, never typed.
 *
 * WHY THIS SECTION EXISTS. A partner's first diligence question is "how
 * much of this is real?", and a landing page that answers it before being
 * asked converts its own smallness into the reason to believe every other
 * number on it. Loop's one asset a funded competitor cannot buy is that
 * every figure here is checkable.
 *
 * WHY IT IS A QUERY AND NOT FOUR TYPED NUMBERS. Because typed numbers were
 * already wrong. The brief this page was designed from said seven things
 * from three people; the database says eleven from four, and thirteen
 * members rather than twelve — it moved while the page was being written.
 * A page that promises "when a number changes, this page changes" has to
 * mean it mechanically, or it is just a nicer kind of claim.
 *
 * WHAT COUNTS AS "ON OFFER" is the same rule the shop window uses and the
 * same rule the app uses (isItemVisible's requireOffered): a price to rent,
 * a price to buy, or explicitly lent free. A thing somebody catalogued but
 * never offered to anybody is not supply, and counting it would be the
 * first lie on the page.
 *
 * It renders nothing until it knows. A skeleton would be a shape implying
 * a number we do not have yet, which on this page of all pages is the
 * wrong instinct.
 */

type Counts = {
  members: number;
  offered: number;
  lenders: number;
  inFidi: number;
};

/** The neighbourhood Loop is opening in, as members might spell it. */
const FIDI = /financial district|fidi/i;

export function Ledger() {
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [people, items] = await Promise.all([
          /* `city` and `id` are the only columns this needs, and both are
             deliberately still readable without signing in — see
             docs/STEP-4-lock-down-profiles.sql, which revoked everything
             else from the anonymous role. */
          supabase.from("profiles").select("id, city"),
          supabase
            .from("inventory_items")
            .select("user_id, rent_price, sharing_price, is_for_borrow")
            .eq("sharing_level", "public")
            .eq("is_available_for_sharing", true)
            .not("is_sold", "is", true)
            .not("is_eliminated", "is", true),
        ]);

        if (cancelled || people.error || items.error) return;

        const offered = (items.data ?? []).filter(
          (it) =>
            (it.rent_price != null && it.rent_price > 0) ||
            (it.sharing_price != null && it.sharing_price > 0) ||
            it.is_for_borrow === true
        );

        setC({
          members: (people.data ?? []).length,
          offered: offered.length,
          lenders: new Set(offered.map((it) => it.user_id)).size,
          inFidi: (people.data ?? []).filter((p) =>
            FIDI.test(p.city ?? "")
          ).length,
        });
      } catch {
        /* Say nothing rather than guess. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!c) return null;

  const cells: [number, string][] = [
    [c.members, "Members"],
    [c.offered, "Things on offer"],
    [c.lenders, "People who offered them"],
    [c.inFidi, "Of us in FiDi, so far"],
  ];

  return (
    <section
      className="px-6 py-20 md:px-12 md:py-24"
      style={{ borderTop: `1px solid ${HAIRLINE}` }}
    >
      <div className="mx-auto max-w-[1100px]">
        <h2
          className="text-[30px] leading-[1.06] md:text-[40px]"
          style={{
            fontFamily: "Instrument Serif, Georgia, serif",
            letterSpacing: "-0.015em",
          }}
        >
          Where Loop actually is, today.
        </h2>
        <p
          className="mt-4 max-w-[620px] text-[16px] leading-[1.62]"
          style={{ color: "#4A4540" }}
        >
          I'll change these when they change. Today they're small, and I'd
          rather you hear them from me than find them.
        </p>

        {/* Vertical hairlines, no cards, no fills, no icons. The numerals
            are the design. */}
        <dl className="mt-12 grid grid-cols-2 md:grid-cols-4">
          {cells.map(([n, labelText], i) => (
            <div
              key={labelText}
              className="px-5 py-4 first:pl-0 md:py-0"
              style={{
                borderLeft: i === 0 ? undefined : `1px solid ${HAIRLINE}`,
              }}
            >
              <dd
                className="text-[42px] leading-none md:text-[60px]"
                style={{
                  fontFamily: "Instrument Serif, Georgia, serif",
                  fontVariantNumeric: "tabular-nums",
                  color: INK,
                  letterSpacing: "-0.01em",
                }}
              >
                {n}
              </dd>
              <dt
                className="mt-3 text-[12px] uppercase"
                style={{ letterSpacing: "0.1em", color: MUTED }}
              >
                {labelText}
              </dt>
            </div>
          ))}
        </dl>

        <div
          className="mt-10 max-w-[620px] space-y-5 text-[16px] leading-[1.62]"
          style={{ color: "#4A4540" }}
        >
          <p>
            That last one is the honest part. Most of Loop is in New Jersey
            right now — Englewood, Jersey City — because that's where my first
            members are. FiDi is where it opens, not where it is. Borrowing
            only works at walking distance, so I'd rather turn on one building
            properly than claim a city I haven't earned.
          </p>
          <p>
            Here's what isn't small. The iPhone app is built and in people's
            hands. Payments run through Stripe. Loop holds the money until you
            both confirm the handoff, then it lands in the lender's bank. The
            fee is 10%, minimum a dollar. None of that is a roadmap — you
            could run a rental through it this afternoon.
          </p>
        </div>
      </div>
    </section>
  );
}
