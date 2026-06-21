"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { addAppointment } from "@/app/(app)/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const UNASSIGNED = "unassigned";

export function AppointmentForm({
  jobId,
  technicians,
  defaultDurationMinutes,
}: {
  jobId: string;
  technicians: { id: string; name: string }[];
  defaultDurationMinutes: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [technician, setTechnician] = useState<string>(UNASSIGNED);
  const [saving, setSaving] = useState(false);

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
      assigned_technician_id: technician === UNASSIGNED ? null : technician,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    setStart("");
    toast({ description: "Appointment scheduled." });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="appt-start">Start</Label>
          <Input
            id="appt-start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-duration">Duration (min)</Label>
          <Input
            id="appt-duration"
            type="number"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.valueAsNumber || 60)}
          />
        </div>
      </div>
      {technicians.length > 0 && (
        <div className="space-y-1.5">
          <Label>Technician</Label>
          <Select value={technician} onValueChange={setTechnician}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="button" onClick={submit} disabled={saving} className="w-full">
        <CalendarPlus className="h-4 w-4" />
        {saving ? "Scheduling…" : "Schedule appointment"}
      </Button>
    </div>
  );
}
