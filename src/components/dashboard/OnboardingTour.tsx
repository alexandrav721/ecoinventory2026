import { useEffect, useState } from "react";
import { Joyride, EVENTS, type EventData, type Step } from "react-joyride";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Loop 🌱",
    content:
      "A 60-second tour of the things that matter most. Track what you own, share with neighbors, and avoid duplicate buys.",
  },
  {
    target: '[data-tour="add-item"]',
    title: "Add items, your way ✨",
    content:
      'Tap the + button to add items by camera, photo, or manual entry. Smart Add uses AI to fill in the details for you.',
    placement: "left",
  },
  {
    target: '[data-tour="ai-assistant"]',
    title: "Chat with the AI Assistant",
    content:
      'Just say what you have — "5 Nike sneakers, size 8.5" — and the assistant adds, edits, or answers questions about your stuff.',
    placement: "left",
  },
  {
    target: '[data-tour="inventory-views"]',
    title: "Gallery, Opportunities & Before You Buy",
    content:
      "Switch views to browse your stuff visually, spot duplicates and earning opportunities, or check before you buy something new.",
    placement: "bottom",
  },
  {
    target: '[data-tour="events-widget"]',
    title: "Community events near you",
    content:
      "Swap parties, repair cafés, stoop sales — meet your neighbors and share what you have. NYC-first for now.",
    placement: "top",
  },
  {
    target: '[data-tour="export-import"]',
    title: "Export & bulk import",
    content:
      "Export your inventory as CSV any time, or bulk-import a spreadsheet to get started fast.",
    placement: "top",
  },
];

export function OnboardingTour({ open, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setRun(true), 200);
      return () => clearTimeout(t);
    }
    setRun(false);
  }, [open]);

  const handleEvent = (data: EventData) => {
    if (data.type === EVENTS.TOUR_END) {
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
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        primaryColor: "hsl(217, 91%, 60%)",
        textColor: "hsl(222, 47%, 11%)",
        backgroundColor: "#ffffff",
        arrowColor: "#ffffff",
        overlayColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 10000,
        skipBeacon: true,
        showProgress: true,
        buttons: ["back", "skip", "primary"],
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Got it!",
        next: "Next",
        skip: "Skip tour",
      }}
      styles={{
        tooltip: { borderRadius: 12, padding: 18 },
        tooltipTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
        tooltipContent: { fontSize: 14, padding: 0, lineHeight: 1.5 },
        buttonPrimary: { borderRadius: 8, fontSize: 13 },
        buttonBack: { fontSize: 13, marginRight: 8 },
        buttonSkip: { fontSize: 13 },
      }}
    />
  );
}
