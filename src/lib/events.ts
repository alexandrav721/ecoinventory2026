import { Repeat, Wrench, Store, HeartHandshake, Users, GraduationCap, type LucideIcon } from "lucide-react";

export type EventType =
  | "swap_party"
  | "repair_cafe"
  | "stoop_sale"
  | "donation_drive"
  | "lending_circle"
  | "skill_share";

export const EVENT_TYPE_META: Record<EventType, { label: string; icon: LucideIcon; color: string }> = {
  swap_party: { label: "Swap Party", icon: Repeat, color: "bg-primary/10 text-primary" },
  repair_cafe: { label: "Repair Café", icon: Wrench, color: "bg-amber-500/10 text-amber-700" },
  stoop_sale: { label: "Stoop Sale", icon: Store, color: "bg-rose-500/10 text-rose-700" },
  donation_drive: { label: "Donation Drive", icon: HeartHandshake, color: "bg-emerald-500/10 text-emerald-700" },
  lending_circle: { label: "Lending Circle", icon: Users, color: "bg-accent/20 text-accent-foreground" },
  skill_share: { label: "Skill Share", icon: GraduationCap, color: "bg-violet-500/10 text-violet-700" },
};

export const BOROUGHS = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
