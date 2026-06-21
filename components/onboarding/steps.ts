/** Ordered onboarding steps — drives the progress bar and next/prev links. */
export const ONBOARDING_STEPS = [
  { path: "/onboarding/company", key: "company" },
  { path: "/onboarding/trade", key: "trade" },
  { path: "/onboarding/pricing-defaults", key: "pricing" },
  { path: "/onboarding/team", key: "team" },
  { path: "/onboarding/integrations", key: "integrations" },
  { path: "/onboarding/plan", key: "plan" },
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
