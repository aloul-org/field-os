"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, RefreshCw } from "lucide-react";

import { sendReviewRequest } from "@/app/(app)/reviews/actions";
import { createRenewalFromJob } from "@/app/(app)/renewals/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Post-completion upsells on the job detail: ask for a review, set a renewal. */
export function JobUpsell({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"review" | "renewal" | null>(null);

  async function review() {
    setBusy("review");
    const res = await sendReviewRequest(jobId);
    setBusy(null);
    toast(
      res.ok
        ? { description: "Review request sent." }
        : { variant: "destructive", description: res.error }
    );
    if (res.ok) router.refresh();
  }

  async function renewal() {
    setBusy("renewal");
    const res = await createRenewalFromJob(jobId);
    setBusy(null);
    toast(
      res.ok
        ? { description: "Renewal reminder set up." }
        : { variant: "destructive", description: res.error }
    );
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={review} disabled={busy !== null}>
        <Star className="h-4 w-4" /> Request a review
      </Button>
      <Button variant="outline" onClick={renewal} disabled={busy !== null}>
        <RefreshCw className="h-4 w-4" /> Set up renewal reminder
      </Button>
    </div>
  );
}
