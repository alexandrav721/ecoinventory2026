/**
 * ⚠️ DEAD FILE as of Oct 2026 — nothing imports this any more.
 *
 * It was imported by InventoryPickleView and DuplicateAlertBanner WITHOUT a
 * demo-mode guard, which meant real signed-in users were shown invented
 * numbers: "12 people want this" for anything containing "macbook",
 * "Est. $220 resale value" for a camera group that may not have existed.
 *
 * Replaced by src/lib/realInsights.ts, which counts duplicates from the
 * user's own rows and demand from open item_requests.
 *
 * Kept only so the DEMO_ITEMS path has something to point at if demo mode is
 * ever rebuilt. Do not import it from anything a signed-in user can reach.
 */
// Mock/static insight data for the My Assets view.
// Keyed by lowercase substrings of item names from DEMO_ITEMS so it lights up
// out of the box in demo mode and degrades gracefully for real users.

export interface DuplicateGroup {
  id: string;
  category: string; // e.g. "cameras"
  message: string; // shown in the alert row
  matchTerms: string[]; // lowercase substrings of item names
  estResaleValue: number;
}

export const MOCK_DUPLICATE_GROUPS: DuplicateGroup[] = [
  {
    id: "dup-cameras",
    category: "cameras",
    message: "3 cameras detected — most households only need 1",
    matchTerms: ["canon eos", "dslr camera", "vintage record player"], // record player swapped for variety; will be filtered to actual matches
    estResaleValue: 220,
  },
  {
    id: "dup-laptops",
    category: "laptops",
    message: "2 laptops detected — consider selling one",
    matchTerms: ["macbook"],
    estResaleValue: 120,
  },
];

export interface DemandSignal {
  match: string; // lowercase substring of item name
  label: string;
}

export const MOCK_DEMAND_SIGNALS: DemandSignal[] = [
  { match: "macbook", label: "12 people want this" },
  { match: "sony wh-1000xm5", label: "High demand nearby" },
  { match: "kitchenaid", label: "8 people want this" },
  { match: "trek mountain bike", label: "Trending in Brooklyn" },
  { match: "patagonia", label: "High demand nearby" },
];

export function findDemandSignal(name: string): DemandSignal | undefined {
  const n = name.toLowerCase();
  return MOCK_DEMAND_SIGNALS.find((d) => n.includes(d.match));
}
