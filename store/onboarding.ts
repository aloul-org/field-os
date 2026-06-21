import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  CompanyStepInput,
  TradeStepInput,
  PricingStepInput,
  TeamInviteInput,
} from "@/lib/validations/onboarding";

type Plan = "starter" | "growth" | "pro" | "enterprise";

interface OnboardingState {
  company: Partial<CompanyStepInput>;
  trade: Partial<TradeStepInput>;
  pricing: Partial<PricingStepInput>;
  team: TeamInviteInput[];
  plan: Plan;
  setCompany: (v: Partial<CompanyStepInput>) => void;
  setTrade: (v: Partial<TradeStepInput>) => void;
  setPricing: (v: Partial<PricingStepInput>) => void;
  setTeam: (v: TeamInviteInput[]) => void;
  setPlan: (v: Plan) => void;
  reset: () => void;
}

const initial = {
  company: { region: "UK", language: "en" } as Partial<CompanyStepInput>,
  trade: {} as Partial<TradeStepInput>,
  pricing: { vat_registered: true, payment_terms_days: 14 } as Partial<PricingStepInput>,
  team: [] as TeamInviteInput[],
  plan: "growth" as Plan,
};

/**
 * Holds the multi-step onboarding answers client-side. Persisted to
 * sessionStorage so a refresh mid-wizard doesn't wipe progress; cleared once
 * the company is created.
 */
export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      setCompany: (v) => set((s) => ({ company: { ...s.company, ...v } })),
      setTrade: (v) => set((s) => ({ trade: { ...s.trade, ...v } })),
      setPricing: (v) => set((s) => ({ pricing: { ...s.pricing, ...v } })),
      setTeam: (team) => set({ team }),
      setPlan: (plan) => set({ plan }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "fieldos-onboarding",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : (undefined as never)
      ),
    }
  )
);
