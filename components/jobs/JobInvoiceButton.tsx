"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { createInvoiceFromJob } from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { JobStatus } from "@/lib/types/database";

export function JobInvoiceButton({
  jobId,
  status,
  invoiceId,
  canWrite,
}: {
  jobId: string;
  status: JobStatus;
  invoiceId: string | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  if (invoiceId) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/invoices/${invoiceId}`}>
          <ReceiptText className="h-4 w-4" /> View invoice
        </Link>
      </Button>
    );
  }

  const ready = status === "completed";

  async function create() {
    setCreating(true);
    const res = await createInvoiceFromJob(jobId);
    setCreating(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.push(`/invoices/${res.data.id}`);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full"
        onClick={create}
        disabled={!canWrite || !ready || creating}
      >
        <ReceiptText className="h-4 w-4" />
        {creating ? "Creating…" : "Create invoice"}
      </Button>
      {!ready && (
        <p className="text-xs text-muted-foreground">
          Mark the job complete to raise an invoice.
        </p>
      )}
    </div>
  );
}
