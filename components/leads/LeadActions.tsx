"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus, X } from "lucide-react";

import { updateLeadStatus, assignLead } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { LeadStatus } from "@/lib/types/database";

interface TeamOption {
  id: string;
  name: string;
  suggested: boolean;
}

export function LeadActions({
  leadId,
  status,
  assignedTo,
  team,
}: {
  leadId: string;
  status: LeadStatus;
  assignedTo: string | null;
  team: TeamOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const done = status === "converted" || status === "lost";

  async function setStatus(next: LeadStatus, lost_reason?: string) {
    setBusy(true);
    const result = await updateLeadStatus({ id: leadId, status: next, lost_reason });
    setBusy(false);
    if (!result.ok) {
      toast({ variant: "destructive", description: result.error });
      return;
    }
    setLostOpen(false);
    router.refresh();
  }

  async function onAssign(value: string) {
    const assigned_to = value === "unassigned" ? null : value;
    setBusy(true);
    const result = await assignLead({ id: leadId, assigned_to });
    setBusy(false);
    if (!result.ok) {
      toast({ variant: "destructive", description: result.error });
      return;
    }
    toast({ description: assigned_to ? "Lead assigned." : "Lead unassigned." });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Primary next action — exactly one per the design system. */}
      {!done && (
        <Button asChild className="w-full">
          <a href={`/estimates/new?leadId=${leadId}`}>Create estimate</a>
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        {status === "new" && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setStatus("contacted")}
          >
            <Check className="h-4 w-4" /> Mark contacted
          </Button>
        )}
        {!done && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setLostOpen(true)}
          >
            <X className="h-4 w-4" /> Mark lost
          </Button>
        )}
      </div>

      {/* Assignment — suggested techs (skills match) float to the top. */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" /> Assigned to
        </label>
        <Select
          value={assignedTo ?? "unassigned"}
          onValueChange={onAssign}
          disabled={busy}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
                {m.suggested ? " · suggested" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this lead as lost</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="Why was it lost? e.g. went with a cheaper quote, no longer needed"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !lostReason.trim()}
              onClick={() => setStatus("lost", lostReason)}
            >
              Mark lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
