"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Progress } from "@/components/ui/progress";
import { stepIndex, TOTAL_STEPS } from "@/components/onboarding/steps";

export function WizardProgress() {
  const pathname = usePathname();
  const t = useTranslations("onboarding");
  const current = stepIndex(pathname) + 1;
  const pct = (current / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {t("stepOf", { current, total: TOTAL_STEPS })}
      </p>
      <Progress value={pct} aria-label={`Step ${current} of ${TOTAL_STEPS}`} />
    </div>
  );
}
