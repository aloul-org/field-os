import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import { ok, err, notFound, parseBody } from "@/lib/api/response";
import { nextDocumentNumber } from "@/lib/documents";

export const runtime = "nodejs";

const bodySchema = z.object({ action: z.enum(["accept", "reject"]) });
const tokenSchema = z.string().uuid();

/**
 * Public (no-login) accept/decline of a quote. Uses the service-role client
 * because the customer is anonymous; the unguessable acceptance_token is the
 * capability. On accept, a job is auto-created and linked (spec Module 5/8).
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  if (!tokenSchema.safeParse(params.token).success) {
    return err("Invalid link", 400);
  }
  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const admin = createAdminClient();

  const { data: estimate } = await admin
    .from("estimates")
    .select("*")
    .eq("acceptance_token", params.token)
    .maybeSingle();

  if (!estimate) return notFound("This quote could not be found.");

  // Idempotent: report the resolved state if it's already been decided.
  if (estimate.status === "accepted" || estimate.status === "rejected") {
    return ok({ status: estimate.status, alreadyDone: true });
  }
  if (estimate.status !== "sent") {
    return err("This quote is no longer available.", 409);
  }

  if (body.action === "reject") {
    await admin
      .from("estimates")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", estimate.id);
    await admin.from("notifications").insert({
      company_id: estimate.company_id,
      user_id: null,
      type: "quote_rejected",
      title: "Quote declined",
      body: `${estimate.estimate_number} (${estimate.job_title}) was declined.`,
      link: `/estimates/${estimate.id}`,
    });
    return ok({ status: "rejected" });
  }

  // Accept → mark accepted, create the job, link both ways, convert the lead.
  const jobNumber = await nextDocumentNumber(admin, "jobs", estimate.company_id);
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .insert({
      company_id: estimate.company_id,
      customer_id: estimate.customer_id,
      property_id: estimate.property_id,
      lead_id: estimate.lead_id,
      estimate_id: estimate.id,
      job_number: jobNumber,
      title: estimate.job_title,
      trade_category: estimate.trade_category,
      description: estimate.summary_for_customer,
      status: "unscheduled",
      priority: "normal",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return err("Could not create the job. Please contact the company.", 500);
  }

  await admin
    .from("estimates")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      job_id: job.id,
    })
    .eq("id", estimate.id);

  if (estimate.lead_id) {
    await admin
      .from("leads")
      .update({ status: "converted", converted_to_job_id: job.id })
      .eq("id", estimate.lead_id);
  }

  await admin.from("notifications").insert({
    company_id: estimate.company_id,
    user_id: null,
    type: "quote_accepted",
    title: "Quote accepted 🎉",
    body: `${estimate.estimate_number} (${estimate.job_title}) was accepted — a job has been created.`,
    link: `/jobs/${job.id}`,
  });

  return ok({ status: "accepted" });
}
