"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { PLANS, planPrice } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/types/database";

const SELECTABLE = PLANS.filter((p) => p.id !== "enterprise");

export function BillingPanel({
  currentPlan,
  status,
  region,
  hasSubscription,
  isOwner,
}: {
  currentPlan: SubscriptionPlan;
  status: SubscriptionStatus;
  region: "UK" | "DE";
  hasSubscription: boolean;
  isOwner: boolean;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function subscribe(plan: SubscriptionPlan) {
    setBusy(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.data?.url) {
        window.location.href = json.data.url;
        return;
      }
      toast({ variant: "destructive", description: json.error ?? "Could not start checkout." });
    } catch {
      toast({ variant: "destructive", description: "Network error — please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.ok && json.data?.url) {
        window.location.href = json.data.url;
        return;
      }
      toast({ variant: "destructive", description: json.error ?? "Could not open billing." });
    } catch {
      toast({ variant: "destructive", description: "Network error — please try again." });
    } finally {
      setBusy(null);
    }
  }

  const statusVariant =
    status === "active"
      ? "success"
      : status === "trialing"
        ? "default"
        : status === "past_due"
          ? "warning"
          : "secondary";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm">
              Current plan:{" "}
              <span className="font-semibold capitalize">{currentPlan}</span>
            </span>
            <Badge variant={statusVariant} className="capitalize">
              {status.replace("_", " ")}
            </Badge>
          </div>
          {isOwner && hasSubscription && (
            <Button variant="outline" size="sm" onClick={openPortal} disabled={busy !== null}>
              <ExternalLink className="h-4 w-4" /> Manage billing
            </Button>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <div className="grid gap-4 sm:grid-cols-3">
          {SELECTABLE.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card key={plan.id} className={cn(plan.recommended && "ring-1 ring-primary")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {plan.recommended && <Badge variant="success">Popular</Badge>}
                  </div>
                  <p className="text-2xl font-bold">
                    {planPrice(plan, region)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || busy !== null}
                    onClick={() => subscribe(plan.id)}
                  >
                    {isCurrent ? "Current plan" : busy === plan.id ? "Redirecting…" : "Choose plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          FieldOS AI takes a <span className="font-medium text-foreground">0.5% fee</span>{" "}
          on payments processed through the platform. Bank transfer and cash
          payments marked manually are never charged a fee.
        </CardContent>
      </Card>
    </div>
  );
}
