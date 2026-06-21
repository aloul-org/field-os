import type { TeamRole } from "@/lib/types/database";

/**
 * App sections used for coarse role-based gating. RLS is the real data
 * boundary; this map drives friendly "no access" UX and sidebar visibility.
 */
export type AppSection =
  | "dashboard"
  | "leads"
  | "calls"
  | "schedule"
  | "jobs"
  | "estimates"
  | "invoices"
  | "customers"
  | "materials"
  | "finance"
  | "coach"
  | "reviews"
  | "team"
  | "settings"
  | "billing";

const ALL: AppSection[] = [
  "dashboard",
  "leads",
  "calls",
  "schedule",
  "jobs",
  "estimates",
  "invoices",
  "customers",
  "materials",
  "finance",
  "coach",
  "reviews",
  "team",
  "settings",
  "billing",
];

const READONLY_ALL = ALL.filter((s) => s !== "billing" && s !== "team");

/**
 * Per-role section access (office surface). `technician` is intentionally empty
 * here — technicians use the /tech app only and are redirected away from /app.
 */
const ROLE_SECTIONS: Record<TeamRole, AppSection[]> = {
  owner: ALL,
  admin: ALL.filter((s) => s !== "billing"),
  dispatcher: ["dashboard", "schedule", "jobs", "leads", "calls", "customers"],
  estimator: ["dashboard", "estimates", "customers", "leads"],
  technician: [],
  viewer: READONLY_ALL,
};

export function canAccess(role: TeamRole, section: AppSection): boolean {
  return ROLE_SECTIONS[role]?.includes(section) ?? false;
}

export function accessibleSections(role: TeamRole): AppSection[] {
  return ROLE_SECTIONS[role] ?? [];
}

/** Viewer is read-only everywhere; technician has no office write access. */
export function canWrite(role: TeamRole): boolean {
  return role !== "viewer" && role !== "technician";
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  dispatcher: "Dispatcher",
  estimator: "Estimator",
  technician: "Technician",
  viewer: "Viewer",
};
