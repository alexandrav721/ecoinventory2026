import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Repeat, Users, Lock } from "lucide-react";

interface LowInventoryPreviewBannerProps {
  itemCount: number;
  onAddItem: () => void;
}

const PREVIEWS = [
  {
    icon: TrendingUp,
    title: "Resale value tracker",
    sample: "$1,240 in resellable items",
    detail: "MacBook Pro · ~$680 · prices steady",
  },
  {
    icon: Repeat,
    title: "Duplicate finder",
    sample: "3 cameras across your home",
    detail: "Could free up ~$420 by selling 2",
  },
  {
    icon: Users,
    title: "Borrow from neighbors",
    sample: "8 items available within 0.5 mi",
    detail: "Drill, ladder, projector & more",
  },
];

export const LowInventoryPreviewBanner = ({
  itemCount,
  onAddItem,
}: LowInventoryPreviewBannerProps) => {
  const remaining = Math.max(0, 5 - itemCount);

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-accent/5 to-emerald-50/60 p-5 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5 max-w-2xl">
          <h3 className="text-base md:text-lg font-semibold leading-snug">
            ✨ Your inventory is just getting started
          </h3>
          <p className="text-sm text-muted-foreground">
            Here's what Loop will show you when you add{" "}
            {remaining > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {remaining} more {remaining === 1 ? "item" : "items"}
                </span>
                :
              </>
            ) : (
              "a few more items:"
            )}
          </p>
        </div>
        <Button onClick={onAddItem} size="sm" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PREVIEWS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="relative rounded-xl border bg-card/60 p-4 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center grayscale opacity-70">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground/80 mb-1">
                {p.title}
              </p>
              <p className="text-sm font-medium text-foreground/60 leading-tight">
                {p.sample}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 leading-snug">
                {p.detail}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                Coming soon for you
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
