"use client";

import { useState } from "react";
import { BadgeCheck, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicInvoicePay({
  token,
  status,
  accentColour,
}: {
  token: string;
  status: string;
  accentColour: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "paid") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 p-4 font-medium text-success">
        <BadgeCheck className="h-5 w-5" /> Paid — thank you
      </div>
    );
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/invoice/${token}/checkout`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.ok && json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      setError(
        json.error ??
          "Online payment isn't available right now — please pay by bank transfer."
      );
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <Button
        size="xl"
        className="w-full"
        onClick={pay}
        disabled={busy}
        style={accentColour ? { backgroundColor: accentColour } : undefined}
      >
        <CreditCard className="h-4 w-4" /> {busy ? "Redirecting…" : "Pay now"}
      </Button>
    </div>
  );
}
