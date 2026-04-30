import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

/**
 * Promotes the High-Impact onboarding quiz.
 * Shows a large empty-state when the user has no items, and a slim banner
 * (dismissible) when they have a few. Manual "Add Item" is always visible
 * so the quiz remains skippable.
 */
export const QuizPrompt = () => {
  const { isDemoMode } = useDemo();
  const [count, setCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("quiz-prompt-collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("quiz-prompt-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (isDemoMode) {
      setCount(0);
      return;
    }
    const seen = localStorage.getItem("quiz-prompt-dismissed") === "true";
    setDismissed(seen);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setCount(count ?? 0));
    });
  }, [isDemoMode]);

  if (count === null) return null;

  // Empty inventory → big editorial CTA
  if (count === 0) {
    return (
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Recommended start
            </div>
            <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
              Start with your <em className="font-display-wonk">big-ticket items</em>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Tracking a $400 espresso machine matters more than tracking a
              spatula. Answer a few questions and we'll suggest the items most
              likely to make you money — or save you from buying again.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard/quiz">
                Take the 2-minute quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/dashboard/add-item">
                <Plus className="w-4 h-4" />
                Add manually instead
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Has items already → slim dismissible banner
  if (dismissed) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-muted/40">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong>Tip:</strong> the quiz can quickly add the high-value items
          you probably haven't logged yet.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="default">
          <Link to="/dashboard/quiz">Take the quiz</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            localStorage.setItem("quiz-prompt-dismissed", "true");
            setDismissed(true);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
