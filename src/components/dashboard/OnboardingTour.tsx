import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Lightbulb, Package, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  tips: string[];
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to EcoInventory 🌱",
    description: "Your personal inventory tracker — organize what you own, avoid duplicate buys, and make smarter decisions about your stuff.",
    icon: Package,
    tips: [
      "Add items with photos, categories, and condition",
      "Access your inventory from any device",
      "Snap a photo and let AI fill in the details",
    ],
  },
  {
    title: "Add Items Your Way ✨",
    description: "Add items quickly with the camera, bulk upload, CSV import, or just chat with the AI assistant.",
    icon: Sparkles,
    tips: [
      "Tap the floating chat to add items conversationally",
      "Use Smart Add to scan multiple items at once",
      "Export your inventory to CSV anytime",
    ],
  },
  {
    title: "Insights & Market Value 📊",
    description: "See what your stuff is worth, spot duplicates and unused items, and find earning or donation opportunities.",
    icon: TrendingUp,
    tips: [
      "Track total market value of your inventory",
      "Get suggestions on what to sell or donate",
      "Identify items you haven't used in a while",
    ],
    highlight: "market-value",
  },
  {
    title: "Share with Your Community 🤝",
    description: "Lend, borrow, sell, or donate with people nearby — save money and reduce waste together.",
    icon: Users,
    tips: [
      "Lend items and track who has what",
      "Browse the community feed to borrow or buy",
      "Mark items donated to track your impact",
    ],
  },
];

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ open, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  useEffect(() => {
    if (open && step.highlight) {
      // Add highlight effect to the metric card
      const element = document.querySelector(`[data-metric="${step.highlight}"]`);
      if (element) {
        element.classList.add("ring-4", "ring-primary", "ring-offset-2", "animate-pulse");
      }
    }

    return () => {
      // Remove all highlights
      const elements = document.querySelectorAll("[data-metric]");
      elements.forEach((el) => {
        el.classList.remove("ring-4", "ring-primary", "ring-offset-2", "animate-pulse");
      });
    };
  }, [currentStep, open, step.highlight]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
          </div>
          <div className="space-y-2 pt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-foreground pt-4">
          {step.description}
        </DialogDescription>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Key Tips:
              </p>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              "Get Started!"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
