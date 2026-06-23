"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * Live dispatch board (spec Module 3). Subscribes to appointment, job and
 * technician-location changes for this company and refreshes the server-rendered
 * board when anything moves — no polling. Realtime honours RLS, so only this
 * company's rows arrive. Refreshes are debounced to coalesce bursts.
 */
export function ScheduleRealtime({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    const channel = supabase
      .channel(`dispatch:${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `company_id=eq.${companyId}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `company_id=eq.${companyId}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "team_members", filter: `company_id=eq.${companyId}` },
        refresh
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [companyId, router]);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={live ? "Live updates on" : "Connecting…"}
    >
      <Radio className={live ? "h-3.5 w-3.5 text-success" : "h-3.5 w-3.5 text-muted-foreground"} />
      {live ? "Live" : "…"}
    </span>
  );
}
