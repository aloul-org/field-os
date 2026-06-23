"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Optimise one technician's stops for the day via the Routes API. */
export function OptimizeRouteButton({
  technicianId,
  date,
}: {
  technicianId: string;
  date: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function optimize() {
    setBusy(true);
    try {
      const res = await fetch("/api/schedule/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technician_id: technicianId, date }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't optimise the route." });
        return;
      }
      toast({ description: "Route optimised for the shortest drive." });
      router.refresh();
    } catch {
      toast({ variant: "destructive", description: "Couldn't optimise the route." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={optimize} disabled={busy}>
      <Route className="h-4 w-4" />
      {busy ? "Optimising…" : "Optimise route"}
    </Button>
  );
}
