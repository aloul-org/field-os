import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";

export const runtime = "nodejs";

// Lower number = safer to bump to tomorrow. Emergency/urgent are never moved.
const MOVE_RANK: Record<string, number> = { flexible: 0, normal: 1 };

const bodySchema = z.object({
  emergency_job_id: z.string().uuid(),
  // Present → apply the proposal; absent → just compute and return it.
  confirm: z
    .object({
      bump_appointment_id: z.string().uuid(),
      technician_id: z.string().uuid(),
      slot_start: z.string(),
      slot_end: z.string(),
    })
    .optional(),
});

/**
 * Emergency same-day slotting (spec Module 3). Finds the lowest-priority movable
 * job remaining today and proposes pushing it to tomorrow to free a slot for the
 * emergency — NEVER auto-applies and never moves another emergency/urgent job.
 * The dispatcher confirms; only then is anything changed.
 */
export async function POST(request: Request) {
  const auth = await getRouteContext("schedule");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const supabase = createClient();

  const { data: emergency } = await supabase
    .from("jobs")
    .select("id, title, priority, status, estimated_duration_minutes")
    .eq("id", body.emergency_job_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!emergency) return err("Job not found.", 404);
  if (emergency.priority !== "emergency") {
    return err("This isn't an emergency job.", 400);
  }

  // ── Apply the confirmed proposal ──────────────────────────────────────────
  if (body.confirm) {
    const c = body.confirm;
    // Push the bumped appointment to the same time tomorrow.
    const { data: bump } = await supabase
      .from("appointments")
      .select("scheduled_start, scheduled_end, job_id")
      .eq("id", c.bump_appointment_id)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    if (!bump) return err("The job to move was not found.", 404);

    const plusDay = (iso: string) =>
      new Date(new Date(iso).getTime() + 86400_000).toISOString();

    await supabase
      .from("appointments")
      .update({
        scheduled_start: plusDay(bump.scheduled_start),
        scheduled_end: plusDay(bump.scheduled_end),
        status: "rescheduled",
      })
      .eq("id", c.bump_appointment_id)
      .eq("company_id", ctx.company.id);

    // Insert the emergency into the freed slot.
    const { error: insErr } = await supabase.from("appointments").insert({
      company_id: ctx.company.id,
      job_id: emergency.id,
      assigned_technician_id: c.technician_id,
      scheduled_start: c.slot_start,
      scheduled_end: c.slot_end,
      status: "scheduled",
    });
    if (insErr) return err("Couldn't insert the emergency job.", 500);

    await supabase
      .from("jobs")
      .update({ status: "scheduled" })
      .eq("id", emergency.id)
      .eq("company_id", ctx.company.id);

    return ok({ applied: true });
  }

  // ── Compute a proposal ────────────────────────────────────────────────────
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayEnd = new Date(`${today}T23:59:59.999Z`).toISOString();

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_start, scheduled_end, assigned_technician_id, status, jobs(title, priority), team_members(name)"
    )
    .eq("company_id", ctx.company.id)
    .gte("scheduled_start", now.toISOString())
    .lte("scheduled_start", dayEnd)
    .eq("status", "scheduled")
    .not("assigned_technician_id", "is", null);

  // Pick the lowest-priority movable appointment, latest first to disrupt least.
  const candidates = (appts ?? [])
    .map((a) => {
      const job = a.jobs as unknown as { title: string; priority: string } | null;
      const tech = a.team_members as unknown as { name: string } | null;
      return { appt: a, priority: job?.priority ?? "normal", title: job?.title ?? "Job", techName: tech?.name ?? "Technician" };
    })
    .filter((c) => c.priority in MOVE_RANK)
    .sort((a, b) => {
      const r = MOVE_RANK[a.priority] - MOVE_RANK[b.priority];
      if (r !== 0) return r;
      return b.appt.scheduled_start.localeCompare(a.appt.scheduled_start);
    });

  const pick = candidates[0];
  if (!pick) {
    return ok({
      proposal: null,
      message:
        "No movable jobs left today — everything remaining is emergency/urgent. Schedule the emergency manually.",
    });
  }

  return ok({
    proposal: {
      emergency_job_id: emergency.id,
      emergency_title: emergency.title,
      bump_appointment_id: pick.appt.id,
      bump_job_title: pick.title,
      technician_id: pick.appt.assigned_technician_id,
      technician_name: pick.techName,
      slot_start: pick.appt.scheduled_start,
      slot_end: pick.appt.scheduled_end,
    },
  });
}
