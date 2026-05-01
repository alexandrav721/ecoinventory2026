import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AddSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  estimatedValue?: number | null;
  totalItemsAfter: number;
  onKeepAdding?: () => void;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 71% 45%)", // emerald
  "hsl(38 92% 50%)", // amber
];

const HOOKS_15_PLUS = [
  "Neighbors near you have items like this — check the Borrow tab.",
  "You're building a serious inventory. Time to share something?",
  "Items like yours get borrowed 3× more when shared publicly.",
];

function getHook(n: number): string {
  if (n <= 1) return "Your first item! Add 4 more to unlock your resale value insights.";
  if (n < 5) return `You're now ${5 - n} ${5 - n === 1 ? "item" : "items"} away from seeing your resale insights.`;
  if (n < 10) return `${10 - n} more and Loop will start spotting duplicates for you.`;
  if (n < 15) return `${15 - n} more ${15 - n === 1 ? "item" : "items"} and you'll unlock borrow-from-neighbor matches.`;
  return HOOKS_15_PLUS[n % HOOKS_15_PLUS.length];
}

export const AddSuccessModal = ({
  open,
  onOpenChange,
  itemName,
  estimatedValue,
  totalItemsAfter,
  onKeepAdding,
}: AddSuccessModalProps) => {
  const navigate = useNavigate();

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.6}s`,
        duration: `${1.8 + Math.random() * 1}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: `${Math.random() * 360}deg`,
      })),
    [open] // regenerate on each open
  );

  const hook = getHook(totalItemsAfter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Confetti layer */}
        <div className="relative h-2 pointer-events-none">
          {open &&
            confettiPieces.map((p, i) => (
              <span
                key={i}
                className="loop-confetti-piece"
                style={{
                  left: p.left,
                  background: p.color,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  transform: `rotate(${p.rotate})`,
                }}
              />
            ))}
        </div>

        <div className="px-6 pt-8 pb-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="font-display text-2xl leading-tight tracking-tight">
              <span className="font-semibold">{itemName}</span> added!
            </h2>
            {estimatedValue != null && estimatedValue > 0 && (
              <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Estimated worth:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(estimatedValue)}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-snug">{hook}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="gap-2 w-full"
              onClick={() => {
                onOpenChange(false);
                onKeepAdding?.();
              }}
            >
              Keep adding
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate("/dashboard?tab=inventory");
              }}
            >
              View my inventory
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
