import { useEffect, useState } from "react";
import { Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightUnlocksPanelProps {
  totalItems: number;
}

const UNLOCKS = [
  { emoji: "💰", title: "Your resale value", threshold: 5 },
  { emoji: "🔄", title: "Duplicate finder", threshold: 10 },
  { emoji: "🤝", title: "Borrow from neighbors", threshold: 15 },
] as const;

const STORAGE_KEY = "loop-unlocks-seen";

export const InsightUnlocksPanel = ({ totalItems }: InsightUnlocksPanelProps) => {
  const [justUnlocked, setJustUnlocked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    let seen: number[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      seen = [];
    }
    const newlyUnlocked = UNLOCKS.filter(
      (u) => totalItems >= u.threshold && !seen.includes(u.threshold)
    ).map((u) => u.threshold);

    if (newlyUnlocked.length > 0) {
      setJustUnlocked(new Set(newlyUnlocked));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...seen, ...newlyUnlocked])
      );
      const t = setTimeout(() => setJustUnlocked(new Set()), 2200);
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  // Find the next unlock to drive the progress bar + headline
  const next = UNLOCKS.find((u) => totalItems < u.threshold);
  const allUnlocked = !next;

  let headline: string;
  let progressPct: number;

  if (allUnlocked) {
    headline = "All insights unlocked — keep building your inventory.";
    progressPct = 100;
  } else {
    const remaining = next.threshold - totalItems;
    progressPct = Math.min(100, Math.round((totalItems / next.threshold) * 100));
    if (totalItems === 0) {
      headline = `Add your first item — ${next.threshold} more to unlock your first insight.`;
    } else if (next === UNLOCKS[0]) {
      headline = `You have ${totalItems} ${totalItems === 1 ? "item" : "items"} — ${remaining} more to unlock your first insight.`;
    } else {
      headline = `${totalItems} items logged — ${remaining} more until ${next.title.toLowerCase()}.`;
    }
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-accent/5 to-emerald-50/60 p-4 space-y-3">
      {/* Progress strip */}
      <div className="space-y-2">
        <p className="text-sm text-foreground/80">{headline}</p>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Three teaser cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {UNLOCKS.map((u) => {
          const unlocked = totalItems >= u.threshold;
          const animating = justUnlocked.has(u.threshold);
          return (
            <div
              key={u.threshold}
              className={cn(
                "relative rounded-xl border border-border/60 p-4 shadow-sm hover:shadow-md transition-all duration-300",
                unlocked
                  ? "bg-card ring-1 ring-emerald-400/40"
                  : "bg-card/60",
                animating && "animate-scale-in ring-2 ring-emerald-400"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "text-2xl leading-none",
                    !unlocked && "grayscale opacity-60"
                  )}
                  aria-hidden
                >
                  {u.emoji}
                </span>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5">
                    <Check className="w-3 h-3" />
                    Unlocked
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="mt-2">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    unlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {u.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {unlocked ? "Available now" : `Unlock at ${u.threshold} items`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
