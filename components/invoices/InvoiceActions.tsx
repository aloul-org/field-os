"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Copy, ExternalLink, Check, BadgeCheck } from "lucide-react";

import { sendInvoice, markInvoicePaid } from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceStatus } from "@/lib/types/database";

export function InvoiceActions({
  id,
  status,
  publicUrl,
  canWrite,
}: {
  id: string;
  status: InvoiceStatus;
  publicUrl: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);

  async function handleSend() {
    setSending(true);
    const res = await sendInvoice(id);
    setSending(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    toast({
      description: res.data.emailed
        ? "Invoice emailed to the customer."
        : "Invoice ready — copy the link to share it.",
    });
    router.refresh();
  }

  async function handleMarkPaid() {
    const res = await markInvoicePaid(id);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    toast({ description: "Invoice marked as paid." });
    router.refresh();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (status === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-medium text-success">
        <BadgeCheck className="h-5 w-5" /> Paid
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {canWrite && status === "draft" && (
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send invoice"}
          </Button>
        )}
        {canWrite && (status === "sent" || status === "overdue") && (
          <Button variant="outline" onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Resend"}
          </Button>
        )}
        {canWrite && status !== "cancelled" && (
          <Button variant="success" onClick={() => setConfirmPaid(true)}>
            <BadgeCheck className="h-4 w-4" /> Mark as paid
          </Button>
        )}
      </div>

      {status !== "draft" && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Public payment link
          </p>
          <div className="flex gap-2">
            <Input readOnly value={publicUrl} className="text-sm" />
            <Button variant="outline" size="icon" aria-label="Copy link" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Open invoice">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmPaid}
        onOpenChange={setConfirmPaid}
        title="Mark this invoice as paid?"
        description="Use this for bank transfer or cash payments. No platform fee is charged on manually-marked payments."
        confirmLabel="Mark as paid"
        destructive={false}
        onConfirm={handleMarkPaid}
      />
    </div>
  );
}
