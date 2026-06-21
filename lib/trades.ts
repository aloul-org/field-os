import {
  Wrench,
  Zap,
  ThermometerSun,
  Home,
  Trees,
  Sparkles,
  Bug,
  WashingMachine,
  Waves,
  HardHat,
  Hammer,
  type LucideIcon,
} from "lucide-react";

import type { Trade } from "@/lib/types/database";

export interface TradeMeta {
  value: Trade;
  label: string;
  /** Slug used by /trades/[trade] marketing pages. */
  slug: string;
  icon: LucideIcon;
}

export const TRADES: TradeMeta[] = [
  { value: "plumbing", label: "Plumbing", slug: "plumbing", icon: Wrench },
  { value: "electrical", label: "Electrical", slug: "electrical", icon: Zap },
  { value: "hvac", label: "HVAC", slug: "hvac", icon: ThermometerSun },
  { value: "roofing", label: "Roofing", slug: "roofing", icon: Home },
  { value: "landscaping", label: "Landscaping", slug: "landscaping", icon: Trees },
  { value: "cleaning", label: "Cleaning", slug: "cleaning", icon: Sparkles },
  { value: "pest_control", label: "Pest control", slug: "pest-control", icon: Bug },
  {
    value: "appliance_repair",
    label: "Appliance repair",
    slug: "appliance-repair",
    icon: WashingMachine,
  },
  { value: "pool_services", label: "Pool services", slug: "pool-services", icon: Waves },
  {
    value: "general_contracting",
    label: "General contracting",
    slug: "general-contracting",
    icon: HardHat,
  },
  { value: "other", label: "Other", slug: "other", icon: Hammer },
];

const BY_VALUE = new Map(TRADES.map((t) => [t.value, t]));
const BY_SLUG = new Map(TRADES.map((t) => [t.slug, t]));

export function tradeByValue(value: string): TradeMeta | undefined {
  return BY_VALUE.get(value as Trade);
}
export function tradeBySlug(slug: string): TradeMeta | undefined {
  return BY_SLUG.get(slug);
}
export function tradeLabel(value: string): string {
  return BY_VALUE.get(value as Trade)?.label ?? value;
}
