/**
 * WelcomeHeader — the "N items added" progress strip at the top of /dashboard.
 *
 * WHAT THIS FILE IS FOR. One number, shown once: how many things you have.
 * It used to compute four (total, value, shared, recently added) and render
 * one; the other three were dead, and so were a greeting, a motivational
 * message and a next-milestone helper. They are gone. A number nothing
 * displays still has to be right, and nobody maintains one that isn't read.
 *
 * TWO BUGS LIVED IN THE DEAD CODE, AND ONE OF THEM REACHED THE SCREEN.
 *
 *   1. Demo mode hardcoded `totalItems: 42` while the demo household has 12
 *      items. /dashboard therefore said "42 items added" directly above a
 *      list of twelve. The first screen a visitor sees contradicted itself.
 *      It now counts the same array the list below it renders from, so the
 *      two cannot drift apart again.
 *
 *   2. It counted `sum(quantity)` rather than rows. The app counts rows
 *      (`counts[shelfOf(item)] += 1` in homeSummary.ts) and never multiplies
 *      money by quantity anywhere — in the app `quantity` is a "×50" badge
 *      on a card, nothing more. So one record collection of 50 counted as
 *      50 things here, 1 thing on /home, 1 thing on /insights and 1 thing
 *      on the phone. Three surfaces and the app agreed; this file didn't.
 *      Rows it is. That also makes the unlock thresholds mean something:
 *      a single multi-quantity row no longer unlocks everything at once.
 *
 * The NULL filter below is the third version of this bug and the reason the
 * comment is long: PostgREST `eq.false` does not match NULL, and all three
 * completion columns are nullable, so `.eq("is_sold", false)` silently drops
 * every row that predates them. `.not(col, "is", true)` keeps NULL, which is
 * what "not sold" actually means.
 */
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightUnlocksPanel } from "@/components/dashboard/InsightUnlocksPanel";

interface WelcomeHeaderProps {
  user: User | null;
}

export const WelcomeHeader = ({ user }: WelcomeHeaderProps) => {
  const { isDemoMode, demoItems } = useDemo();
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      /* The same array /dashboard lists below. Counting it here instead of
         stating a number means the header cannot disagree with the list. */
      setTotalItems(
        demoItems.filter(
          (i: any) => !i.is_sold && !i.is_donated && !i.is_eliminated
        ).length
      );
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      /* head: true asks Postgres for the count and sends no rows — this
         screen needs the number, not the things. */
      const { count, error } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("is_sold", "is", true)
        .not("is_donated", "is", true)
        .not("is_eliminated", "is", true);

      if (cancelled) return;
      /* On error the count stays 0 rather than becoming a guess. */
      if (!error && typeof count === "number") setTotalItems(count);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isDemoMode, demoItems]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InsightUnlocksPanel totalItems={totalItems} />
    </div>
  );
};
