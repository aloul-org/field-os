import type { JobStatus } from "@/lib/types/database";

type BadgeVariant = "secondary" | "default" | "success" | "warning" | "destructive";

/**
 * Status metadata without translated labels — labels are looked up via
 * `useTranslations("status")` / `getTranslations("status")` in the rendering
 * component, keyed as `status.job.<key>` (see messages/en.json + de.json).
 */
export const JOB_STATUS_META: Record<JobStatus, { variant: BadgeVariant }> = {
  unscheduled: { variant: "warning" },
  scheduled: { variant: "default" },
  en_route: { variant: "default" },
  in_progress: { variant: "default" },
  completed: { variant: "success" },
  invoiced: { variant: "secondary" },
  cancelled: { variant: "destructive" },
};

/** Status select options, in lifecycle order. Labels come from `status.job.<key>`. */
export const JOB_STATUSES: JobStatus[] = [
  "unscheduled",
  "scheduled",
  "en_route",
  "in_progress",
  "completed",
  "invoiced",
  "cancelled",
];

/** Board columns on the jobs list, each matching one or more underlying statuses. */
export const JOB_STATUS_COLUMNS: { key: JobStatus; match: JobStatus[] }[] = [
  { key: "unscheduled", match: ["unscheduled"] },
  { key: "scheduled", match: ["scheduled"] },
  { key: "in_progress", match: ["en_route", "in_progress"] },
  { key: "completed", match: ["completed"] },
  { key: "invoiced", match: ["invoiced"] },
];
