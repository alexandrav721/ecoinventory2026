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
import { ChevronLeft, ChevronRight, TrendingUp, Receipt, DollarSign, Gift, Lightbulb, Package, Heart, BarChart3, Users } from "lucide-react";
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
    title: "Welcome to EcoInventory! 🌱",
    description: "Your personal inventory tracker that helps you organize, share, sell, and make smarter decisions about your stuff.",
    icon: Package,
    tips: [
      "Keep track of everything you own in one place",
      "Know what you have to avoid duplicate purchases",
      "Organize items by location, category, and condition",
      "Access your inventory from anywhere",
    ],
  },
  {
    title: "Donate & Declutter 💚",
    description: "Identify items you no longer need and give them a second life through donation.",
    icon: Heart,
    tips: [
      "Mark items as donated to track your giving impact",
      "See the value of items you've donated over time",
      "Help reduce waste by passing things on to others",
      "Feel good about decluttering with purpose",
    ],
  },
  {
    title: "Analyze Excess Inventory 📊",
    description: "Our smart insights help you spot duplicates, rarely-used items, and things you might not need.",
    icon: BarChart3,
    tips: [
      "Find duplicate items you didn't know you had",
      "Identify items you haven't used in a while",
      "Get recommendations on what to sell or donate",
      "Make informed decisions about your belongings",
    ],
    highlight: "quick-insights",
  },
  {
    title: "Share with Your Community 🤝",
    description: "Connect with friends and neighbors to borrow, lend, and share items instead of buying new.",
    icon: Users,
    tips: [
      "Lend items to friends and track who has what",
      "Borrow things you only need occasionally",
      "Build a sharing community in your neighborhood",
      "Save money and reduce waste together",
    ],
  },
  {
    title: "Market Value & Selling 💰",
    description: "See what your items are worth and discover earning opportunities.",
    icon: TrendingUp,
    tips: [
      "Track what your items could sell for",
      "Compare prices with similar items in the marketplace",
      "Identify which items have the most earning potential",
      "Monitor your selling performance over time",
    ],
    highlight: "market-value",
  },
  {
    title: "Ready to Get Organized! 🚀",
    description: "You're all set! Start adding items to your inventory and take control of your stuff.",
    icon: Lightbulb,
    tips: [
      "Add items with photos for easy identification",
      "Use categories and locations to stay organized",
      "Check Analytics regularly for insights",
      "Share items with friends to build your community",
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
