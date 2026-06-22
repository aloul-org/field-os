"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import {
  appointmentSchema,
  jobStatusEnum,
  type AppointmentInput,
  type JobStatusValue,
} from "@/lib/validations/job";

type Result = { ok: true } | { ok: false; error: string };
const WRITE_DENIED = "You don't have permission to make changes.";

export async function updateJobStatus(
  id: string,
  status: JobStatusValue
): Promise<Result> {
  const ctx = await requireSection("jobs");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };
  if (!jobStatusEnum.safeParse(status).success) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not update the job." };
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  return { ok: true };
}

export async function addAppointment(input: AppointmentInput): Promise<Result> {
  const ctx = await requireSection("jobs");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid appointment." };
  }
  const d = parsed.data;

  const start = new Date(d.scheduled_start);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Invalid start time." };
  }
  const end = new Date(start.getTime() + d.duration_minutes * 60000);

  const supabase = createClient();

  // Verify the job belongs to the company before scheduling.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", d.job_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!job) return { ok: false, error: "Job not found." };

  const { error } = await supabase.from("appointments").insert({
    company_id: ctx.company.id,
    job_id: d.job_id,
    assigned_technician_id: d.assigned_technician_id ?? null,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    status: "scheduled",
  });

  if (error) return { ok: false, error: "Could not schedule the appointment." };

  // Move an unscheduled job to scheduled once it has an appointment.
  if (job.status === "unscheduled") {
    await supabase
      .from("jobs")
      .update({ status: "scheduled" })
      .eq("id", d.job_id)
      .eq("company_id", ctx.company.id);
  }

  revalidatePath(`/jobs/${d.job_id}`);
  revalidatePath("/jobs");
  revalidatePath("/schedule");
  return { ok: true };
}

/** Reschedule an existing appointment (drag/edit on the dispatch board). */
export async function rescheduleAppointment(input: {
  appointment_id: string;
  scheduled_start: string;
  duration_minutes: number;
  assigned_technician_id?: string | null;
}): Promise<Result> {
  const ctx = await requireSection("schedule");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const start = new Date(input.scheduled_start);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Invalid start time." };
  }
  const duration = Number(input.duration_minutes) || 60;
  const end = new Date(start.getTime() + duration * 60000);

  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      assigned_technician_id: input.assigned_technician_id ?? null,
      status: "rescheduled",
    })
    .eq("id", input.appointment_id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not reschedule." };
  revalidatePath("/schedule");
  return { ok: true };
}

export async function cancelAppointment(appointmentId: string): Promise<Result> {
  const ctx = await requireSection("schedule");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not cancel the appointment." };
  revalidatePath("/schedule");
  return { ok: true };
}
