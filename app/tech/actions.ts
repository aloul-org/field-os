"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/session";
import type { JobStatus } from "@/lib/types/database";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Statuses a technician may set from the field, in lifecycle order. */
const TECH_STATUSES = new Set<JobStatus>(["en_route", "in_progress", "completed"]);

/** Confirm this job is assigned to the calling technician (via its appointments). */
async function assertOwnsJob(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  technicianId: string,
  jobId: string
): Promise<boolean> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!job) return false;

  const { data: appt } = await supabase
    .from("appointments")
    .select("id")
    .eq("job_id", jobId)
    .eq("assigned_technician_id", technicianId)
    .limit(1)
    .maybeSingle();
  return Boolean(appt);
}

export async function advanceJobStatus(
  jobId: string,
  status: JobStatus
): Promise<Result> {
  const ctx = await requireTechnician();
  if (!TECH_STATUSES.has(status)) {
    return { ok: false, error: "That status can't be set from the field." };
  }

  const supabase = createClient();
  if (!(await assertOwnsJob(supabase, ctx.company.id, ctx.member.id, jobId))) {
    return { ok: false, error: "This job isn't assigned to you." };
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", jobId)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Couldn't update the job." };

  // Mirror onto the technician's appointment for the live dispatch board.
  const apptStatus =
    status === "en_route" ? "en_route" : status === "in_progress" ? "on_site" : "completed";
  await supabase
    .from("appointments")
    .update({ status: apptStatus })
    .eq("job_id", jobId)
    .eq("assigned_technician_id", ctx.member.id);

  revalidatePath("/tech/today");
  revalidatePath(`/tech/jobs/${jobId}`);
  return { ok: true, data: undefined };
}

export async function toggleChecklistItem(
  itemId: string,
  isComplete: boolean
): Promise<Result> {
  // Auth gate only — RLS scopes job_checklist_items to the company's jobs, so the
  // update below is safe under the technician's own session.
  await requireTechnician();
  const supabase = createClient();

  const { data: item, error } = await supabase
    .from("job_checklist_items")
    .update({ is_complete: isComplete })
    .eq("id", itemId)
    .select("job_id")
    .maybeSingle();

  if (error || !item) return { ok: false, error: "Couldn't update the checklist." };
  revalidatePath(`/tech/jobs/${item.job_id}`);
  return { ok: true, data: undefined };
}

/** Finalise a job: store the customer signature, mark complete, notify office. */
export async function completeJobWithSignature(input: {
  jobId: string;
  signatureDataUrl: string;
  signedByName: string;
}): Promise<Result> {
  const ctx = await requireTechnician();
  const supabase = createClient();

  if (!(await assertOwnsJob(supabase, ctx.company.id, ctx.member.id, input.jobId))) {
    return { ok: false, error: "This job isn't assigned to you." };
  }
  if (!input.signedByName.trim()) {
    return { ok: false, error: "Ask the customer to enter their name." };
  }

  // Decode the data URL (data:image/png;base64,xxxx) into bytes.
  const match = input.signatureDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) return { ok: false, error: "Signature image was invalid." };
  const bytes = Buffer.from(match[1], "base64");

  const path = `${ctx.company.id}/${input.jobId}.png`;
  const { error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (uploadError) return { ok: false, error: "Couldn't save the signature." };

  const { data: signed } = await supabase.storage
    .from("signatures")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  // Upsert the job report with the signature.
  const { data: existing } = await supabase
    .from("job_reports")
    .select("id")
    .eq("job_id", input.jobId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("job_reports")
      .update({ signature_url: signed?.signedUrl ?? path, signed_by_name: input.signedByName.trim() })
      .eq("id", existing.id);
  } else {
    await supabase.from("job_reports").insert({
      job_id: input.jobId,
      technician_id: ctx.member.id,
      signature_url: signed?.signedUrl ?? path,
      signed_by_name: input.signedByName.trim(),
    });
  }

  await supabase
    .from("jobs")
    .update({ status: "completed" })
    .eq("id", input.jobId)
    .eq("company_id", ctx.company.id);

  await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("job_id", input.jobId)
    .eq("assigned_technician_id", ctx.member.id);

  // Notify the office so they can invoice.
  await supabase.from("notifications").insert({
    company_id: ctx.company.id,
    user_id: null,
    type: "job_completed",
    title: "Job completed",
    body: `${ctx.member.name} completed a job — ready to invoice.`,
    link: `/jobs/${input.jobId}`,
  });

  revalidatePath("/tech/today");
  revalidatePath(`/tech/jobs/${input.jobId}`);
  return { ok: true, data: undefined };
}
