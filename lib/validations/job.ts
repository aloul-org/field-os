import { z } from "zod";

export const jobStatusEnum = z.enum([
  "unscheduled",
  "scheduled",
  "en_route",
  "in_progress",
  "completed",
  "invoiced",
  "cancelled",
]);

export const appointmentSchema = z.object({
  job_id: z.string().uuid(),
  scheduled_start: z.string().min(1, "Pick a start time"),
  duration_minutes: z.number().int().positive().max(24 * 60),
  assigned_technician_id: z.string().uuid().optional().nullable(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type JobStatusValue = z.infer<typeof jobStatusEnum>;
