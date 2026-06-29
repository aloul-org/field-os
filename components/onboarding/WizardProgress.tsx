"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  stepIndex,
  TOTAL_STEPS,
} from "@/components/onboarding/steps";

export function WizardProgress() {
  const pathname = usePathname();
  const t = useTranslations("onboarding");
  const current = stepIndex(pathname);

  return (
    <div className="mb-8">
      <p className="mb-3 text-right text-xs font-medium text-muted-foreground">
        {t("stepOf", { current: current + 1, total: TOTAL_STEPS })}
      </p>

      <ol className="flex items-start">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const isLast = i === ONBOARDING_STEPS.length - 1;
          return (
            <li
              key={step.path}
              className="relative flex flex-1 flex-col items-center"
              aria-current={active ? "step" : undefined}
            >
              {/* Connector to the next step (sits behind the circles). */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors",
                    done ? "bg-primary" : "bg-border"
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-semibold tabular-nums transition-all duration-200",
                  done && "border-primary bg-primary text-primary-foreground",
                  active &&
                    "border-primary bg-background text-primary ring-4 ring-primary/15",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>

              <span
                className={cn(
                  "mt-2 max-w-[5.5rem] text-center text-[11px] font-medium leading-tight transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(step.labelKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
