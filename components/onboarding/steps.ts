/**
 * Ordered onboarding steps — drives the stepper and next/prev links. `labelKey`
 * is the short stepper caption (under the `onboarding` i18n namespace).
 */
export const ONBOARDING_STEPS = [
  { path: "/onboarding/company", key: "company", labelKey: "labelCompany" },
  { path: "/onboarding/trade", key: "trade", labelKey: "labelTrade" },
  { path: "/onboarding/pricing-defaults", key: "pricing", labelKey: "labelPricing" },
  { path: "/onboarding/team", key: "team", labelKey: "labelTeam" },
  { path: "/onboarding/integrations", key: "integrations", labelKey: "labelIntegrations" },
  { path: "/onboarding/plan", key: "plan", labelKey: "labelPlan" },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export function stepIndex(pathname: string): number {
  const i = ONBOARDING_STEPS.findIndex((s) => pathname.startsWith(s.path));
  return i === -1 ? 0 : i;
}

export function nextStepPath(pathname: string): string {
  const i = stepIndex(pathname);
  return ONBOARDING_STEPS[Math.min(i + 1, TOTAL_STEPS - 1)].path;
}

export function prevStepPath(pathname: string): string {
  const i = stepIndex(pathname);
  return ONBOARDING_STEPS[Math.max(i - 1, 0)].path;
}
