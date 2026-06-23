"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Proposal {
  emergency_job_id: string;
  emergency_title: string;
  bump_appointment_id: string;
  bump_job_title: string;
  technician_id: string;
  technician_name: string;
  slot_start: string;
  slot_end: string;
}

/** Find a same-day slot for an emergency job by bumping a lower-priority one. */
export function EmergencyFitButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function propose() {
    setBusy(true);
    setProposal(null);
    setMessage(null);
    setOpen(true);
    try {
      const res = await fetch("/api/schedule/reschedule-emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency_job_id: jobId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Couldn't work out a slot.");
        return;
      }
      if (json.data.proposal) setProposal(json.data.proposal);
      else setMessage(json.data.message ?? "No movable jobs today.");
    } catch {
      setMessage("Couldn't reach the scheduler.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!proposal) return;
    setBusy(true);
    try {
      const res = await fetch("/api/schedule/reschedule-emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency_job_id: proposal.emergency_job_id,
          confirm: {
            bump_appointment_id: proposal.bump_appointment_id,
            technician_id: proposal.technician_id,
            slot_start: proposal.slot_start,
            slot_end: proposal.slot_end,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't apply." });
        return;
      }
      toast({ description: "Emergency slotted in." });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Button size="sm" variant="destructive" onClick={propose}>
        <Zap className="h-4 w-4" /> Fit in today
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fit in this emergency</DialogTitle>
          </DialogHeader>
          {busy && !proposal ? (
            <p className="text-sm text-muted-foreground">Working out the best slot…</p>
          ) : proposal ? (
            <p className="text-sm">
              Move <span className="font-medium">{proposal.bump_job_title}</span> to tomorrow and
              insert <span className="font-medium">{proposal.emergency_title}</span> with{" "}
              <span className="font-medium">{proposal.technician_name}</span> at{" "}
              {time(proposal.slot_start)}?
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {proposal && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirm} disabled={busy}>
                {busy ? "Applying…" : "Confirm"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
