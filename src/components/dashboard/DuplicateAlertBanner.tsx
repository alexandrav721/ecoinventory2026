import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupDuplicates } from "@/lib/realInsights";

const STORAGE_KEY = "loop.duplicateAlert.dismissed";

interface Props {
  /** All current item names (lowercased) so we can verify a group has matches. */
  itemNames: string[];
  /** Called when the user clicks "View items" to highlight matches. */
  onViewItems: (matchTerms: string[]) => void;
}

export const DuplicateAlertBanner = ({ itemNames, onViewItems }: Props) => {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  /* Real piles from the user's own item names.
   *
   * This used to read MOCK_DUPLICATE_GROUPS, a fixed list that announced
   * "3 cameras detected — most households only need 1" to anyone who owned
   * something matching the string "canon eos", whether or not they owned
   * three of anything.
   *
   * Note the message is now a COUNT and nothing else. The mock editorialised
   * ("most households only need 1", "consider selling one"), which is a
   * verdict — and this banner appears unbidden on the dashboard, which is
   * the wrong place to be told what to own. The count is the finding; what
   * to do about it is the user's call. */
  const activeGroups = groupDuplicates(
    itemNames.map((n) => ({ name: n })),
  ).map((p) => ({
    id: p.key,
    message: `${p.count} \u00d7 ${p.label}`,
    hits: p.terms,
  }));

  if (dismissed || activeGroups.length === 0) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-900">
            You may have duplicates
          </span>
          <span className="text-xs text-amber-700/80">
            · {activeGroups.length} group{activeGroups.length === 1 ? "" : "s"}
          </span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-amber-100 text-amber-700"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={dismiss}
            className="p-1 rounded hover:bg-amber-100 text-amber-700"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "transition-all overflow-hidden",
          collapsed ? "max-h-0" : "max-h-96",
        )}
      >
        <ul className="px-4 pb-3 space-y-1.5">
          {activeGroups.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between text-sm text-amber-900/90"
            >
              <span>{g.message}</span>
              <button
                onClick={() => onViewItems(g.hits)}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
              >
                View items
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
