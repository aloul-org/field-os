"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Copy, Check, ThumbsDown } from "lucide-react";

import { sendReviewRequest, logBadReview } from "@/app/(app)/reviews/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function RequestReviewButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const res = await sendReviewRequest(jobId);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    toast({ description: "Review request sent." });
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={send} disabled={busy}>
      <Star className="h-4 w-4" /> Request review
    </Button>
  );
}

export function LogBadReviewDialog({
  customers,
}: {
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (!customerId) {
      toast({ variant: "destructive", description: "Pick a customer." });
      return;
    }
    setBusy(true);
    const res = await logBadReview({ customerId, note });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    setDraft(res.data.draft);
    router.refresh();
  }

  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", description: "Couldn't copy." });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setDraft(null);
          setNote("");
          setCustomerId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <ThumbsDown className="h-4 w-4" /> Log a bad review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a bad review</DialogTitle>
        </DialogHeader>
        {draft ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Customer flagged and the office notified. Here&apos;s a suggested outreach message:
            </p>
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{draft}</p>
            <Button variant="outline" className="w-full" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy message"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bad-note">What happened?</Label>
                <Textarea
                  id="bad-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. unhappy with the tidy-up after the job"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? "Saving…" : "Log & draft outreach"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
