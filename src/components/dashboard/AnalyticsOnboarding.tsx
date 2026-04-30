import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Copy, Lightbulb, ArrowRight, Package, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const STORAGE_KEY = "analytics-onboarding-completed";

const AnalyticsOnboarding = ({ open, onComplete }: AnalyticsOnboardingProps) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Quick Insights! 🎯",
      description: "Let me show you powerful ways to analyze your inventory and discover hidden opportunities.",
      icon: Lightbulb,
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground">
              Quick Insights automatically analyzes your inventory and provides actionable recommendations. But there's more you can do!
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm">Find items you're not using</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm">Identify excess inventory</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm">Discover duplicate items</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Analyze Excess Items 📦",
      description: "Compare your inventory against typical household benchmarks",
      icon: RefreshCw,
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-100">What it does:</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Compares your inventory quantities against typical household benchmarks to identify items you may have in excess.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Example Results:</p>
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">15 Coffee Mugs</p>
                  <p className="text-xs text-muted-foreground">Typical: 8 • You have: 15</p>
                  <Badge variant="outline" className="text-xs mt-1">Consider donating 7</Badge>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">12 Bath Towels</p>
                  <p className="text-xs text-muted-foreground">Typical: 6 • You have: 12</p>
                  <Badge variant="outline" className="text-xs mt-1">Potential to share 6</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-medium">💡 Tip:</span> Use this to declutter and help others by donating or sharing excess items!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Analyze Duplicates 📋",
      description: "Find similar items you might not have noticed",
      icon: Copy,
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">What it does:</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Finds similar items based on name, brand, color, and tags. Perfect for discovering unintentional duplicates.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Example Results:</p>
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Group 1: White T-Shirts</p>
                  <Badge variant="secondary" className="text-xs">85% match</Badge>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-primary/30">
                  <p className="text-xs text-muted-foreground">• White T-Shirt - Nike</p>
                  <p className="text-xs text-muted-foreground">• Cotton White Tee - Nike</p>
                  <p className="text-xs text-muted-foreground">• White Cotton Shirt</p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Group 2: Black Jeans</p>
                  <Badge variant="secondary" className="text-xs">92% match</Badge>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-primary/30">
                  <p className="text-xs text-muted-foreground">• Black Jeans - Levi's</p>
                  <p className="text-xs text-muted-foreground">• Black Denim Pants - Levi's</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
            <p className="text-sm text-green-900 dark:text-green-100">
              <span className="font-medium">💡 Tip:</span> Consolidate similar items to reduce clutter and make finding things easier!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Analyze! 🚀",
      description: "You're all set to discover insights about your inventory",
      icon: CheckCircle2,
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">You're Ready to Go!</p>
            <p className="text-sm text-muted-foreground">
              Look for the Quick Insights section on your dashboard to access these analysis tools anytime.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Tips:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm">Run analyses periodically to keep your inventory optimized</p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm">Hover over buttons for quick reminders of what each analysis does</p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">Act on insights to declutter and help your community</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(STORAGE_KEY, "true");
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {currentStep.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative">
          {currentStep.content}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  index <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="flex-1 sm:flex-initial">
                Previous
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} className="flex-1 sm:flex-initial">
              Skip
            </Button>
            <Button onClick={handleNext} className="flex-1 sm:flex-initial">
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const useAnalyticsOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay to let the dashboard load first
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    handleComplete,
  };
};

export default AnalyticsOnboarding;
