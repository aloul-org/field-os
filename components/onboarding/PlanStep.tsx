"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { PLANS, planPrice } from "@/lib/plans";
import { useOnboarding } from "@/store/onboarding";
import {
  createCompanySchema,
  type CreateCompanyInput,
} from "@/lib/validations/onboarding";
import { createCompanyAction } from "@/app/(auth)/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@/lib/types/database";

// Only the self-serve trial plans are selectable here; Enterprise is sales-led.
const SELECTABLE = PLANS.filter((p) => p.id !== "enterprise");

export function PlanStep() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const store = useOnboarding();
  const region = (store.company.region ?? "UK") as "UK" | "DE";

  const [selected, setSelected] = useState<SubscriptionPlan>(store.plan);
  const [submitting, setSubmitting] = useState(false);

  async function finish() {
    setSubmitting(true);
    store.setPlan(selected);

    const payload: CreateCompanyInput = {
      company: store.company as CreateCompanyInput["company"],
      trade: store.trade as CreateCompanyInput["trade"],
      pricing: store.pricing as CreateCompanyInput["pricing"],
      team: store.team,
      plan: selected,
    };

    const parsed = createCompanySchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitting(false);
      toast({
        variant: "destructive",
        description: "Please go back and complete the earlier steps.",
      });
      return;
    }

    const result = await createCompanyAction(parsed.data);
    if (!result.ok) {
      setSubmitting(false);
      toast({ variant: "destructive", description: result.error });
      return;
    }

    store.reset();
    router.replace(result.destination);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("planTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("planSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SELECTABLE.map((plan) => {
          const active = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(plan.id)}
              className={cn(
                "flex flex-col rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary ring-1 ring-primary" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{plan.name}</span>
                {plan.recommended && (
                  <Badge variant="success">{t("recommended")}</Badge>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {planPrice(plan, region)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{plan.users}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
        {t("planSubtitle")}
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/onboarding/integrations")}
          disabled={submitting}
        >
          {tc("back")}
        </Button>
        <Button type="button" size="lg" onClick={finish} disabled={submitting}>
          {submitting ? t("finishing") : t("startTrial")}
        </Button>
      </div>
    </div>
  );
}
