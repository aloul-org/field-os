"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Copy, ExternalLink, Check, ReceiptText, Briefcase } from "lucide-react";

import { sendEstimate } from "@/app/(app)/estimates/actions";
import { createInvoiceFromEstimate } from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { EstimateStatus } from "@/lib/types/database";

export function EstimateActions({
  id,
  status,
  publicUrl,
  jobId,
  canWrite,
}: {
  id: string;
  status: EstimateStatus;
  publicUrl: string;
  jobId: string | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSend() {
    setSending(true);
    const res = await sendEstimate(id);
    setSending(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    toast({
      description: res.data.emailed
        ? "Quote emailed to the customer."
        : "Quote is ready — copy the link to share it.",
    });
    router.refresh();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleCreateInvoice() {
    setCreatingInvoice(true);
    const res = await createInvoiceFromEstimate(id);
    setCreatingInvoice(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.push(`/invoices/${res.data.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {canWrite && status === "draft" && (
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send to customer"}
          </Button>
        )}
        {canWrite && status === "sent" && (
          <Button variant="outline" onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Resend"}
          </Button>
        )}
        {status === "accepted" && jobId && (
          <Button asChild variant="outline">
            <Link href={`/jobs/${jobId}`}>
              <Briefcase className="h-4 w-4" /> View job
            </Link>
          </Button>
        )}
        {canWrite && status === "accepted" && (
          <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
            <ReceiptText className="h-4 w-4" />
            {creatingInvoice ? "Creating…" : "Create invoice"}
          </Button>
        )}
      </div>

      {status !== "draft" && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Public quote link
          </p>
          <div className="flex gap-2">
            <Input readOnly value={publicUrl} className="text-sm" />
            <Button variant="outline" size="icon" aria-label="Copy link" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Open quote">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
