/**
 * Insights — your whole collection, and what is honestly knowable about it.
 *
 * THE RULE THIS SCREEN IS BUILT ON. Every figure states what it is out of,
 * and "not recorded" is a visible category rather than a silent zero. That
 * is not decoration: Loop's most interesting columns are its emptiest, and
 * the existing dashboard computes `(item.original_price || 0)` in three
 * places — turning "I never said" into "$0" and dragging every average down.
 * src/lib/coverage.ts makes the denominator impossible to omit.
 *
 * WHAT IT DELIBERATELY DOES NOT DO:
 *
 *   - No valuation. There is no resale-price source in this database. A
 *     figure labelled "what your things are worth" would be the sum of
 *     whatever prices happened to be typed, presented as an appraisal.
 *     The money card says what it actually is: what you paid, across the
 *     ones you priced.
 *   - No cost-per-use. usage_frequency is a single answer someone gave
 *     once, not a log of anything. Dividing money by it produces a number
 *     that looks measured and isn't. The frequency is shown as what it is:
 *     what you said.
 *   - No verdict. It states what is there. "You own 23 tote bags" alone is
 *     a judgement; next to a way to act on it, it is an observation. The
 *     app's /everything screen holds the same line and says so in its header.
 *
 * The wall and the bands come from src/lib/everything.ts, a byte-identical
 * port of the app's model, so both surfaces group a collection the same way.
 */
import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/useHomeSummary";
import { useDemo } from "@/contexts/DemoContext";
import { buildBands, type EverythingBand } from "@/lib/everything";
import { coverageNote, coverageOf, sumKnown, tally } from "@/lib/coverage";
import { groupDuplicates } from "@/lib/realInsights";
import DashboardNav from "@/components/DashboardNav";

const USE_ORDER = ["daily", "weekly", "monthly", "rarely", "never"];

function useInsightsData(userId: string | undefined) {
  const items = useQuery({
    queryKey: ["insights-items", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(
          "id, name, brand, color, category_id, image_urls, original_price, purchase_date, usage_frequency, love_rating, is_sold, is_donated"
        )
        .eq("user_id", userId!)
        .not("is_eliminated", "is", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = useQuery({
    queryKey: ["insights-categories"],
    staleTime: 600_000,
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name");
      return data ?? [];
    },
  });

  return { items, categories };
}

/** A figure that cannot be rendered without its denominator. */
function Figure({
  value,
  label,
  note,
  thin = false,
}: {
  value: string;
  label: string;
  note: string;
  thin?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-[34px] leading-[44px] text-foreground mt-1 tabular-nums">
        {value}
      </p>
      <p
        className={`text-[12px] leading-4 mt-0.5 ${
          thin ? "text-claret" : "text-muted-foreground"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function Band({ band }: { band: EverythingBand }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[30px] leading-[39px] text-foreground tabular-nums">
          {band.count}
        </span>
        <span className="text-[15px] text-muted-foreground">{band.label}</span>
      </div>
      <div className="mt-3 grid grid-cols-6 sm:grid-cols-10 gap-1.5">
        {band.items.map((it: any) => {
          const uri = (it.image_urls ?? []).find(
            (u: string) => typeof u === "string" && u.trim() !== ""
          );
          return (
            <div
              key={it.id}
              title={it.name ?? ""}
              className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {uri ? (
                <img
                  src={uri}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Insights() {
  const { user, checking } = useSessionUser();
  /* Same reason as Home: demo visitors land on the signed-in surfaces and
     must not be thrown at /auth. */
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const { items, categories } = useInsightsData(isDemoMode ? undefined : user?.id);

  const rows = useMemo(() => {
    const src = isDemoMode ? (demoItems as any[]) : ((items.data ?? []) as any[]);
    return src.filter((r) => !r.is_sold && !r.is_donated);
  }, [items.data, isDemoMode, demoItems]);

  const bands = useMemo(
    () =>
      buildBands(
        rows as any,
        (isDemoMode ? (demoCategories as any) : (categories.data ?? [])) as any
      ),
    [rows, categories.data, isDemoMode, demoCategories]
  );

  const photo = useMemo(
    () =>
      coverageOf(rows, (r: any) =>
        (r.image_urls ?? []).some((u: string) => typeof u === "string" && u.trim() !== "")
      ),
    [rows]
  );
  const paid = useMemo(() => sumKnown(rows, (r: any) => r.original_price), [rows]);
  const use = useMemo(() => tally(rows, (r: any) => r.usage_frequency, USE_ORDER), [rows]);
  const piles = useMemo(() => groupDuplicates(rows as any), [rows]);

  if (checking) return <div className="min-h-screen bg-background" />;
  if (!user && !isDemoMode) return <Navigate to="/auth" replace />;

  const total = rows.length;
  const useRecorded = use.find((u) => u.key === "__unrecorded")?.count ?? 0;
  const useCoverage = { known: total - useRecorded, unknown: useRecorded, total, ratio: total ? (total - useRecorded) / total : 0, thin: total > 0 && (total - useRecorded) / total < 0.5 };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          your loop
        </p>
        <h1 className="font-display italic text-[38px] leading-[50px] text-foreground mt-1">
          Everything you own.
        </h1>

        {!isDemoMode && items.isLoading ? (
          <div className="mt-6 h-40 rounded-2xl border border-border bg-card animate-pulse" />
        ) : total === 0 ? (
          <section className="mt-6 rounded-2xl border border-border bg-card px-6 py-8">
            <h2 className="font-display text-[24px] leading-[32px] text-foreground">
              Nothing to show yet.
            </h2>
            <p className="text-[15px] leading-6 text-muted-foreground mt-2 max-w-md">
              Add a few things and this fills in. Nothing here is a guess — every
              number comes from what you've actually recorded.
            </p>
            <Link
              to="/dashboard/add-item"
              className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-[14px] text-primary-foreground"
            >
              Add a thing
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Figure
                value={String(total)}
                label="Things"
                note={`All ${total} counted`}
              />
              <Figure
                value={`${Math.round(photo.ratio * 100)}%`}
                label="With a photo"
                note={coverageNote(photo, "things")}
                thin={photo.thin}
              />
              <Figure
                value={
                  paid.coverage.known > 0
                    ? `$${Math.round(paid.sum).toLocaleString()}`
                    : "—"
                }
                label="What you paid"
                note={
                  paid.coverage.known === 0
                    ? "No prices recorded"
                    : `${coverageNote(paid.coverage, "things")} · not a valuation`
                }
                thin={paid.coverage.thin}
              />
              <Figure
                value={String(piles.length)}
                label="Things you have more than one of"
                note={
                  piles.length === 0
                    ? "No repeats by name"
                    : piles
                        .slice(0, 2)
                        .map((p) => `${p.count} × ${p.label}`)
                        .join(" · ")
                }
              />
            </div>

            {/* Self-reported, and labelled as such in the heading rather than
                in small print underneath it. */}
            <section className="mt-9">
              <h2 className="font-display italic text-[25px] leading-[32px] text-foreground">
                How often you said you use things
              </h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                {coverageNote(useCoverage, "things")} · your own answers, not
                measured
              </p>
              <div className="mt-4 space-y-2">
                {use
                  .filter((u) => u.count > 0)
                  .map((u) => (
                    <div key={u.key} className="flex items-center gap-3">
                      <span
                        className={`w-24 shrink-0 text-[13px] ${
                          u.recorded ? "text-foreground" : "text-muted-foreground italic"
                        }`}
                      >
                        {u.label}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${total ? (u.count / total) * 100 : 0}%`,
                            background: u.recorded
                              ? "hsl(var(--claret))"
                              : "hsl(var(--line))",
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-[13px] text-muted-foreground tabular-nums">
                        {u.count}
                      </span>
                    </div>
                  ))}
              </div>
            </section>

            {/* The wall. Duplicate piles first — that is the whole effect. */}
            <div className="mt-10 border-t border-border pt-2">
              {bands.map((b) => (
                <Band key={b.key} band={b} />
              ))}
            </div>

            <p className="mt-10 text-[12px] leading-5 text-muted-foreground max-w-xl">
              Every number here is counted from what you recorded. Nothing is
              estimated, and nothing you left blank has been treated as zero.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
