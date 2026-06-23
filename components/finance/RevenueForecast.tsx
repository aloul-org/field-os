"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type Region = "UK" | "DE";

interface ForecastData {
  nextMonth: string;
  projectedRevenue: number;
  momChangePct: number | null;
  seasonalApplied: boolean;
}

/**
 * Revenue forecast card. The projection is computed server-side with real math
 * (lib/finance/forecast.ts); this fetches it post-render so the AI narrative
 * doesn't block the finance dashboard.
 */
export function RevenueForecast({ region }: { region: Region }) {
  const currency = (n: number) => formatCurrency(n, region);
  const [data, setData] = useState<ForecastData | null>(null);
  const [narrative, setNarrative] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/finance/forecast", { method: "POST" })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.ok) {
          setData(json.data.forecast);
          setNarrative(json.data.narrative ?? "");
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Revenue forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Working out your forecast…</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Revenue forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {narrative || "Not enough paid-invoice history yet to forecast."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const up = (data.momChangePct ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Revenue forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold">
            {currency(data.projectedRevenue)}
          </span>
          {data.momChangePct != null && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${up ? "text-success" : "text-destructive"}`}
            >
              {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(data.momChangePct)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Projected for {data.nextMonth}
          {data.seasonalApplied ? " · seasonally adjusted" : ""}
        </p>
        {narrative && <p className="text-sm">{narrative}</p>}
      </CardContent>
    </Card>
  );
}
