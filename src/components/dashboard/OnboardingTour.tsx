import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to EcoInventory 🌱",
    content:
      "A 60-second tour of the things that matter most. Track what you own, share with neighbors, and avoid duplicate buys.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-item"]',
    title: "Add items, your way ✨",
    content:
      "Tap the + button to add items by camera, photo, or manual entry. Smart Add uses AI to fill in the details for you.",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="ai-assistant"]',
    title: "Chat with the AI Assistant",
    content:
      "Just say what you have — \"5 Nike sneakers, size 8.5\" — and the assistant adds, edits, or answers questions about your stuff.",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: '[data-tour="inventory-views"]',
    title: "Gallery, Opportunities & Before You Buy",
    content:
      "Switch views to browse your stuff visually, spot duplicates and earning opportunities, or check before you buy something new.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="events-widget"]',
    title: "Community events near you",
    content:
      "Swap parties, repair cafés, stoop sales — meet your neighbors and share what you have. NYC-first for now.",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="export-import"]',
    title: "Export & bulk import",
    content:
      "Export your inventory as CSV any time, or bulk-import a spreadsheet to get started fast.",
    placement: "top",
    disableBeacon: true,
  },
];

export function OnboardingTour({ open, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (open) {
      // tiny delay so target elements are mounted
      const t = setTimeout(() => setRun(true), 150);
      return () => clearTimeout(t);
    }
    setRun(false);
  }, [open]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finished.includes(status)) {
      setRun(false);
      onComplete();
    }
  };

  if (!open) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          arrowColor: "hsl(var(--background))",
          overlayColor: "hsla(0, 0%, 0%, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 18,
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          padding: 0,
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: 8,
          fontSize: 13,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
          marginRight: 8,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Got it!",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}
