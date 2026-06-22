"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Sparkles } from "lucide-react";

import { addAppointment } from "@/app/(app)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const UNASSIGNED = "unassigned";

export function ScheduleJobDialog({
  jobId,
  jobTitle,
  technicians,
  defaultDate,
  defaultDurationMinutes,
  suggestedTechId,
}: {
  jobId: string;
  jobTitle: string;
  technicians: { id: string; name: string }[];
  /** YYYY-MM-DD currently shown on the board, used to seed the picker. */
  defaultDate: string;
  defaultDurationMinutes: number;
  suggestedTechId?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(`${defaultDate}T09:00`);
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [tech, setTech] = useState(suggestedTechId ?? UNASSIGNED);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestReasons, setSuggestReasons] = useState<string[]>([]);

  async function suggest() {
    setSuggesting(true);
    setSuggestReasons([]);
    try {
      const res = await fetch("/api/schedule/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, date: defaultDate }),
      });
      const json = await res.json();
      const top = json?.data?.suggestions?.[0];
      if (!top) {
        toast({ description: json?.data?.note ?? "No suggestion available." });
        return;
      }
      setTech(top.technician_id);
      // scheduled_start is ISO/UTC; trim to the datetime-local format.
      setStart(new Date(top.scheduled_start).toISOString().slice(0, 16));
      setSuggestReasons(top.reasons ?? []);
    } catch {
      toast({ variant: "destructive", description: "Couldn't get a suggestion." });
    } finally {
      setSuggesting(false);
    }
  }

  async function submit() {
    if (!start) {
      toast({ variant: "destructive", description: "Pick a start time." });
      return;
    }
    setSaving(true);
    const res = await addAppointment({
      job_id: jobId,
      scheduled_start: new Date(start).toISOString(),
      duration_minutes: Number(duration) || 60,
      assigned_technician_id: tech === UNASSIGNED ? null : tech,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    setOpen(false);
    toast({ description: "Appointment scheduled." });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="h-4 w-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">Schedule: {jobTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={suggest}
            disabled={suggesting}
          >
            <Sparkles className="h-4 w-4" />
            {suggesting ? "Finding the best slot…" : "Suggest best technician & slot"}
          </Button>
          {suggestReasons.length > 0 && (
            <ul className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {suggestReasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sched-start">Start</Label>
              <Input
                id="sched-start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-duration">Duration (min)</Label>
              <Input
                id="sched-duration"
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(e.target.valueAsNumber || 60)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Technician</Label>
            <Select value={tech} onValueChange={setTech}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.id === suggestedTechId ? " · suggested" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Scheduling…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
