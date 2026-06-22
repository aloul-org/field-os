import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { buildCandidates, rankTechnicians } from "@/lib/scheduling/autoSchedule";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const bodySchema = z.object({
  job_id: z.string().uuid(),
  date: z.string().regex(DATE_RE),
});

/**
 * Suggest the best technician + slot for an unscheduled job (spec Module 3).
 * Returns ranked suggestions for the dispatcher to confirm — never auto-books.
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
  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, trade_category, estimated_duration_minutes, properties(lat, lng)"
    )
    .eq("id", body.job_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!job) return err("Job not found.", 404);

  const property = job.properties as unknown as
    | { lat: number | null; lng: number | null }
    | null;
  const jobLocation =
    property?.lat != null && property?.lng != null
      ? { lat: property.lat, lng: property.lng }
      : null;
  const duration = job.estimated_duration_minutes ?? 60;

  const candidates = await buildCandidates(
    supabase,
    ctx.company.id,
    body.date,
    duration
  );

  if (candidates.length === 0) {
    return ok({ suggestions: [], note: "No active technicians to suggest." });
  }

  const suggestions = await rankTechnicians({
    trade_category: job.trade_category,
    durationMinutes: duration,
    jobLocation,
    candidates,
  });

  return ok({ suggestions: suggestions.slice(0, 3) });
}
