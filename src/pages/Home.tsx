/**
 * Home — the web half of Loop's summary page.
 *
 * Deliberately the SAME SCREEN as the app's Home tab, reading the same rows
 * through the same model (src/lib/homeSummary.ts, a byte-identical copy of
 * the app's). Add a thing on the phone and this ring moves; change it here
 * and the phone moves. That is not a sync mechanism — it is one database
 * and two readers, which is the only version of "in sync" that cannot drift.
 *
 * Three rules carried over from the app's screen, for the same reasons:
 *
 *   1. ONE NUMBER IS THE SCREEN. Everything under the ring is quiet.
 *   2. NO MONEY, NO USAGE. original_price and purchase_date are nullable and
 *      usually empty; usage_frequency is a one-time self-report. Figures that
 *      need a caveat belong on a screen that can carry one. Not this one.
 *   3. THE RING'S SEGMENTS ALWAYS SUM TO THE MIDDLE NUMBER. Enforced in the
 *      model by shelf precedence, not here. An item that is both for sale and
 *      for borrow counts once.
 */
import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Camera, Plus } from "lucide-react";
import { useHomeSummary, useSessionUser } from "@/hooks/useHomeSummary";
import { matchWant } from "@/lib/wantMatch";
import type { ShelfKey } from "@/lib/homeSummary";
import DashboardNav from "@/components/DashboardNav";

/** Three values that stay apart at a 14px stroke. Private must be visible:
 *  most collections are almost entirely private, and against the track a
 *  near-track colour reads as an empty circle — i.e. as a failed load. */
const SHELF_COLOR: Record<ShelfKey, string> = {
  sale: "hsl(var(--claret))",
  lend: "hsl(var(--success))",
  private: "hsl(var(--faint))",
};

const SIZE = 184;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function Ring({
  total,
  shelves,
}: {
  total: number;
  shelves: { key: ShelfKey; label: string; count: number }[];
}) {
  const arcs = useMemo(() => {
    if (total === 0) return [];
    let acc = 0;
    return shelves
      .filter((s) => s.count > 0)
      .map((s) => {
        const fraction = s.count / total;
        const a = { key: s.key, fraction, offset: acc };
        acc += fraction;
        return a;
      });
  }, [total, shelves]);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={STROKE}
        />
        {arcs.map((a) => {
          const len = CIRC * a.fraction;
          // A whole ring gets no dash gap — with one segment the 2px gap
          // reads as a rendering fault, because there is nothing to separate.
          const whole = a.fraction >= 0.999;
          return (
            <circle
              key={a.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={SHELF_COLOR[a.key]}
              strokeWidth={STROKE}
              strokeDasharray={
                whole ? `${CIRC} 0` : `${Math.max(0, len - 3)} ${CIRC}`
              }
              strokeDashoffset={whole ? 0 : -CIRC * a.offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[54px] leading-[70px] text-foreground tabular-nums">
          {total}
        </span>
        <span className="text-[11px] text-muted-foreground -mt-2">
          {total === 1 ? "thing" : "things"}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, checking } = useSessionUser();
  const { summary, firstName, items, asks, isLoading } = useHomeSummary(user?.id);

  if (checking) {
    return <div className="min-h-screen bg-background" />;
  }
  /* <Navigate>, not navigate() — calling the imperative one during render
     updates the router while this component is still rendering, which React
     warns about and which can drop the redirect under concurrent rendering. */
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          your loop
        </p>
        <h1 className="font-display italic text-[38px] leading-[50px] text-foreground mt-1">
          {firstName ? `Hi, ${firstName}.` : "Your Loop."}
        </h1>

        {isLoading ? (
          <div className="mt-6 h-64 rounded-2xl bg-card border border-border animate-pulse" />
        ) : summary.total === 0 ? (
          /* No ring, no zeroes. A ring of nothing reads as a broken screen,
             and four "0"s read as a scolding on day one. */
          <section className="mt-6 rounded-2xl border border-border bg-card px-6 py-8">
            <h2 className="font-display text-[26px] leading-[34px] text-foreground">
              Nothing in your Loop yet.
            </h2>
            <p className="text-[15px] leading-6 text-muted-foreground mt-2 max-w-md">
              Add a few things you own. You'll see them gathered here, and you
              can decide later what to lend, sell, or keep private.
            </p>
            <Link
              to="/dashboard/add-item"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Add a thing
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border border-border bg-card px-6 py-7">
              {/* Stacks on a phone. Side by side, the 184px ring plus its
                  gap leaves 75px for a row reading "For sale ... 0" on a
                  375px screen, which wraps into a mess. The reference this
                  screen is modelled on was a phone preview, so this is the
                  layout that has to be right, not the desktop one. */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-7">
                <Ring total={summary.total} shelves={summary.shelves} />
                <div className="w-full sm:flex-1 min-w-0">
                  {summary.shelves.map((s) => (
                    <div key={s.key} className="flex items-center gap-3 mb-3.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: SHELF_COLOR[s.key] }}
                      />
                      <span className="text-[14px] text-muted-foreground flex-1">
                        {s.label}
                      </span>
                      <span className="text-[16px] text-foreground tabular-nums">
                        {s.count}
                      </span>
                    </div>
                  ))}
                  {summary.movedOn > 0 && (
                    <p className="text-[12px] text-muted-foreground/70 mt-1">
                      {summary.movedOn} moved on
                    </p>
                  )}
                </div>
              </div>
              <Link
                to="/dashboard"
                className="mt-5 pt-5 border-t border-border flex items-center text-[14px] text-foreground hover:text-claret transition-colors"
              >
                <span className="flex-1">See everything you own</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </section>

            {/* The one thing to do. Renders only when true, and names the
                consequence rather than just counting: an item with no photo
                is invisible to everyone else, which is Loop's own rule. */}
            {summary.missingPhoto > 0 && (
              <Link
                to="/dashboard"
                className="mt-3 flex items-center gap-3 rounded-xl bg-accent px-4 py-4"
              >
                <Camera className="h-[18px] w-[18px] text-claret shrink-0" />
                <span className="text-[14px] leading-5 text-foreground flex-1">
                  {summary.missingPhoto}{" "}
                  {summary.missingPhoto === 1 ? "thing has" : "things have"} no
                  photo, so neighbours can't see{" "}
                  {summary.missingPhoto === 1 ? "it" : "them"}.
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            )}

            {/* The Ask Board. Always rendered, even empty — Loop has supply
                and almost no stated demand, and an invisible section cannot
                fix that. Asking needs no photo and no price, so it is the
                cheapest useful thing a new person can do. */}
            <section className="mt-9">
              <div className="flex items-end gap-3">
                <h2 className="font-display italic text-[25px] leading-[32px] text-foreground flex-1">
                  Does anyone have a…?
                </h2>
                {asks.length > 0 && (
                  <Link to="/dashboard" className="text-[13px] text-muted-foreground">
                    See all
                  </Link>
                )}
              </div>
              <div className="mt-3 rounded-2xl bg-accent overflow-hidden">
                {asks.length > 0 ? (
                  asks.map((ask, i) => {
                    const matches = matchWant(ask.itemName, items as any);
                    return (
                      <div
                        key={ask.id}
                        className="px-5 py-4"
                        style={
                          i === 0
                            ? undefined
                            : { borderTop: "1px solid hsl(var(--claret) / 0.12)" }
                        }
                      >
                        <p className="text-[15px] text-foreground">{ask.itemName}</p>
                        {ask.description && (
                          <p className="text-[13px] leading-[18px] text-muted-foreground mt-1 line-clamp-2">
                            {ask.description}
                          </p>
                        )}
                        <p className="text-[12px] text-muted-foreground/70 mt-1.5">
                          {ask.requesterName}
                        </p>
                        {matches.length > 0 && (
                          <p className="text-[13px] text-claret mt-2.5">
                            {matches.length === 1
                              ? `Your ${matches[0].item.name} might match`
                              : `${matches.length} of your things might match`}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-6">
                    <p className="text-[14px] leading-5 text-foreground">
                      Nobody has asked for anything yet.
                    </p>
                    <p className="text-[13px] leading-[18px] text-muted-foreground mt-1">
                      Post what you need and the neighbours who have one get a
                      nudge. It takes a sentence.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {summary.latest.length > 0 && (
              <section className="mt-9">
                <h2 className="font-display italic text-[25px] leading-[32px] text-foreground">
                  Lately
                </h2>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {summary.latest.map((it: any) => {
                    const uri = (it.image_urls ?? []).find(
                      (u: string) => typeof u === "string" && u.trim() !== ""
                    );
                    return (
                      <Link key={it.id} to={`/dashboard/item/${it.id}`} className="block group">
                        <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
                          {uri ? (
                            <img
                              src={uri}
                              alt={it.name ?? ""}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          ) : null}
                        </div>
                        <p className="mt-2 truncate text-[12px] text-foreground">
                          {it.name ?? "Untitled"}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
