"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { TRADES } from "@/lib/trades";
import { useOnboarding } from "@/store/onboarding";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/lib/types/database";

type Size = "solo" | "2-5" | "6-20" | "21-100";

export function TradeStep() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const { trade, setTrade } = useOnboarding();

  const [selectedTrade, setSelectedTrade] = useState<Trade | undefined>(
    trade.trade
  );
  const [size, setSize] = useState<Size | undefined>(trade.company_size);

  const sizes: { value: Size; label: string }[] = [
    { value: "solo", label: t("sizeSolo") },
    { value: "2-5", label: t("size2to5") },
    { value: "6-20", label: t("size6to20") },
    { value: "21-100", label: t("size21to100") },
  ];

  function onContinue() {
    if (!selectedTrade || !size) return;
    setTrade({ trade: selectedTrade, company_size: size });
    router.push("/onboarding/pricing-defaults");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("tradeTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("tradeSubtitle")}</p>
      </div>

      <div
        role="radiogroup"
        aria-label={t("tradeTitle")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {TRADES.map(({ value, label, icon: Icon }) => {
          const active = selectedTrade === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedTrade(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-accent text-accent-foreground"
                  : "hover:border-primary/40 hover:bg-muted"
              )}
            >
              <Icon className="h-7 w-7" aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t("companySize")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sizes.map(({ value, label }) => {
            const active = size === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSize(value)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "hover:border-primary/40 hover:bg-muted"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/onboarding/company")}
        >
          {tc("back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          disabled={!selectedTrade || !size}
        >
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
