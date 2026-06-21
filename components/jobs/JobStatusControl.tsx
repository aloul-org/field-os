"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateJobStatus } from "@/app/(app)/jobs/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { JobStatus } from "@/lib/types/database";

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: "unscheduled", label: "Unscheduled" },
  { value: "scheduled", label: "Scheduled" },
  { value: "en_route", label: "En route" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
];

export function JobStatusControl({
  jobId,
  status,
  disabled,
}: {
  jobId: string;
  status: JobStatus;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<JobStatus>(status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    const previous = value;
    setValue(next as JobStatus);
    setSaving(true);
    const res = await updateJobStatus(jobId, next as JobStatus);
    setSaving(false);
    if (!res.ok) {
      setValue(previous);
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || saving}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
