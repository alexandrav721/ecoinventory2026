import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AddItemModal } from "@/components/dashboard/AddItemModal";

interface InsightUnlocksPanelProps {
  totalItems: number;
}

const UNLOCKS = [
  { title: "your first insight", threshold: 5 },
  { title: "duplicate finder", threshold: 10 },
  { title: "borrow from neighbors", threshold: 15 },
] as const;

export const InsightUnlocksPanel = ({ totalItems }: InsightUnlocksPanelProps) => {
  const [addOpen, setAddOpen] = useState(false);

  const next = UNLOCKS.find((u) => totalItems < u.threshold);
  const allUnlocked = !next;

  const progressPct = allUnlocked
    ? 100
    : Math.min(100, Math.round((totalItems / next.threshold) * 100));

  const remaining = allUnlocked ? 0 : next.threshold - totalItems;
  const actionLabel = allUnlocked
    ? "All insights unlocked"
    : `Add ${remaining} more to unlock ${next.title}`;

  return (
    <>
      <div className="flex items-center gap-3 w-full">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {totalItems} {totalItems === 1 ? "item" : "items"} added
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden min-w-[40px]">
          <div
            className="h-full bg-emerald-500 transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => !allUnlocked && setAddOpen(true)}
          disabled={allUnlocked}
          className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-default"
        >
          {actionLabel}
          {!allUnlocked && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
      <AddItemModal open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
};
