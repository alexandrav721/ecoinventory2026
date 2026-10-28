import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InsightUnlocksPanelProps {
  totalItems: number;
}

const UNLOCKS = [
  { title: "your first insight", threshold: 5 },
  { title: "duplicate finder", threshold: 10 },
  { title: "borrow from neighbors", threshold: 15 },
] as const;

export const InsightUnlocksPanel = ({ totalItems }: InsightUnlocksPanelProps) => {
  /* Was opening AddItemModal, which contains zero Supabase calls and a
     MOCK_EMAIL_ITEMS array — a signed-in user could fill it in and nothing
     was ever written. /dashboard/add-item is the page that actually
     inserts into inventory_items, and therefore the page the app sees. */
  const navigate = useNavigate();

  const next = UNLOCKS.find((u) => totalItems < u.threshold);
  const allUnlocked = !next;

  const progressPct = allUnlocked
    ? 100
    : Math.min(100, Math.round((totalItems / next.threshold) * 100));

  const remaining = allUnlocked ? 0 : next.threshold - totalItems;
  const actionLabel = allUnlocked
    ? "Nothing left to unlock"
    /* Was "Add 5 more to unlock duplicate finder" — game-mechanics
       phrasing for what is only a count. Loop is not withholding a
       feature; there is simply not enough yet for it to say anything. */
    : `${remaining} more ${remaining === 1 ? "thing" : "things"} and Loop can find your duplicates`;

  return (
    <>
      <div className="flex items-center gap-3 w-full">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {totalItems} {totalItems === 1 ? "item" : "items"} added
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden min-w-[40px]">
          <div
            className="h-full bg-claret transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => !allUnlocked && navigate("/dashboard/add-item")}
          disabled={allUnlocked}
          className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-default"
        >
          {actionLabel}
          {!allUnlocked && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </>
  );
};
