"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, PhoneCall, Star, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Every item here is optional and skippable — onboarding must finish in under
 * 3 minutes for someone who skips everything. Real connection flows (Stripe
 * OAuth, Twilio provisioning, Google Business Profile) live in Settings; this
 * step only signposts them.
 */
export function IntegrationsStep() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();

  const items = [
    { icon: CreditCard, label: t("connectStripe") },
    { icon: PhoneCall, label: t("provisionTwilio") },
    { icon: Star, label: t("connectGoogle") },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("integrationsTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("integrationsSubtitle")}
        </p>
      </div>

      <ul className="space-y-3">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Set up later in Settings"
            >
              {tc("comingSoon")}
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/onboarding/team")}
        >
          {tc("back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => router.push("/onboarding/plan")}
        >
          {tc("skip")} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
