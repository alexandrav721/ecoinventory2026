/**
 * What Loop can tell you once there is something to tell you about.
 *
 * WHAT THIS REPLACED, AND WHY IT HAD TO GO. The previous version showed
 * three padlocked, greyed-out cards containing:
 *
 *     "$1,240 in resellable items"   ·  "MacBook Pro · ~$680 · prices steady"
 *     "3 cameras across your home"   ·  "Could free up ~$420 by selling 2"
 *     "8 items available within 0.5 mi" · "Drill, ladder, projector & more"
 *
 * None of that was real. It was invented data, rendered in a locked-and-
 * dimmed treatment that reads exactly like the viewer's own figures behind
 * a paywall — on the dashboard of someone who has added almost nothing. It
 * promised a "resale value tracker" the product deliberately does not have
 * (src/lib/valuation.ts estimates depreciation and is never presented as an
 * appraisal), and a 0.5-mile radius the website cannot compute.
 *
 * It is the same rule the whole product is built on, stated in
 * src/pages/Insights.tsx: nothing is estimated, and nothing you left blank
 * is treated as zero. A fabricated preview of your own numbers is the
 * worst version of breaking it, because it is indistinguishable from the
 * real thing.
 *
 * So this now says what each feature IS, in the product's own words, with
 * no numbers at all. Nothing here can be mistaken for the viewer's data,
 * because there is nothing here that could be anyone's data.
 */
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LowInventoryPreviewBannerProps {
  itemCount: number;
  onAddItem: () => void;
}

/** Three true sentences about three real features. No figures. */
const WHAT_YOU_GET = [
  {
    title: "What you've spent",
    line: "Totalled from the prices you type. Blanks stay blank — never zero.",
  },
  {
    title: "Things you own twice",
    line: "Counted by name. The count is the finding; what to do about it is yours.",
  },
  {
    title: "Lend it out",
    line: "Anything you list can be borrowed, rented or bought by a neighbour.",
  },
];

export const LowInventoryPreviewBanner = ({
  itemCount,
  onAddItem,
}: LowInventoryPreviewBannerProps) => {
  const remaining = Math.max(0, 5 - itemCount);

  return (
    /* A hairline and paper. The old card was a three-stop gradient
       (primary -> accent -> emerald-50), which belongs to no Loop
       palette. */
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5 max-w-2xl">
          <h3
            className="text-[22px] leading-tight italic"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            {remaining > 0
              ? `Add ${remaining} more and this starts working.`
              : "This starts working now."}
          </h3>
          <p className="text-sm text-muted-foreground">
            Loop needs a few of your things before it has anything true to
            say about them.
          </p>
        </div>
        <Button onClick={onAddItem} size="sm" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add a thing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {WHAT_YOU_GET.map((p) => (
          /* No padlocks, no grayscale, no "Coming soon for you". Nothing
             is being withheld — there is simply nothing to count yet. */
          <div key={p.title}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-claret font-semibold">
              {p.title}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground mt-1.5">
              {p.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
