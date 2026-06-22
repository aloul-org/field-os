"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, MapPin, CheckCircle2 } from "lucide-react";

import { advanceJobStatus } from "@/app/tech/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { JobStatus } from "@/lib/types/database";

/**
 * The single large lifecycle button on each job card. Advances
 * scheduled → en_route → in_progress, then routes to the job detail for the
 * signature-gated completion step. Big tap target (h-14) for gloved fingers.
 */
export function TechStatusButton({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function set(next: JobStatus) {
    setBusy(true);
    const res = await advanceJobStatus(jobId, next);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.refresh();
  }

  if (status === "completed" || status === "invoiced") {
    return (
      <Button disabled variant="secondary" className="h-14 w-full text-base">
        <CheckCircle2 className="h-5 w-5" /> Completed
      </Button>
    );
  }

  if (status === "scheduled") {
    return (
      <Button
        className="h-14 w-full text-base"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          set("en_route");
        }}
      >
        <Navigation className="h-5 w-5" /> On my way
      </Button>
    );
  }

  if (status === "en_route") {
    return (
      <Button
        className="h-14 w-full text-base"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          set("in_progress");
        }}
      >
        <MapPin className="h-5 w-5" /> Arrived
      </Button>
    );
  }

  // in_progress → completion happens on the detail page (signature required).
  return (
    <Button
      className="h-14 w-full text-base"
      onClick={(e) => {
        e.preventDefault();
        router.push(`/tech/jobs/${jobId}`);
      }}
    >
      <CheckCircle2 className="h-5 w-5" /> Complete job
    </Button>
  );
}
