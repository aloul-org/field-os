"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { createLeadWithScoring } from "@/lib/leads/createLead";
import {
  createLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  type CreateLeadInput,
  type UpdateLeadStatusInput,
  type AssignLeadInput,
} from "@/lib/validations/lead";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

/** Manual lead entry. Scoring + hot/warm notification happen inline. */
export async function createLead(
  input: CreateLeadInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("leads");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead." };
  }
  const d = parsed.data;

  const supabase = createClient();
  const result = await createLeadWithScoring(
    supabase,
    {
      company_id: ctx.company.id,
      source: d.source,
      contact_name: d.contact_name,
      contact_phone: d.contact_phone || null,
      contact_email: d.contact_email || null,
      job_description: d.job_description || null,
      address: d.address || null,
    },
    ctx.company.trade
  );

  if (!result) return { ok: false, error: "Could not save the lead." };

  revalidatePath("/leads");
  return { ok: true, data: { id: result.id } };
}

export async function updateLeadStatus(
  input: UpdateLeadStatusInput
): Promise<Result> {
  const ctx = await requireSection("leads");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = updateLeadStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }
  const { id, status, lost_reason } = parsed.data;

  if (status === "lost" && !lost_reason?.trim()) {
    return { ok: false, error: "Add a reason so we can learn from lost leads." };
  }

  const supabase = createClient();
  // Stash the lost reason in score_reason if provided (no dedicated column in v1).
  const patch: { status: typeof status; score_reason?: string } = { status };
  if (status === "lost" && lost_reason) {
    patch.score_reason = `Lost: ${lost_reason.trim()}`;
  }

  const { error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not update the lead." };

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return { ok: true, data: undefined };
}

export async function assignLead(input: AssignLeadInput): Promise<Result> {
  const ctx = await requireSection("leads");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = assignLeadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { id, assigned_to } = parsed.data;

  const supabase = createClient();

  // Guard: the assignee must belong to this company.
  if (assigned_to) {
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("id", assigned_to)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    if (!member) return { ok: false, error: "That team member was not found." };
  }

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not assign the lead." };

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return { ok: true, data: undefined };
}
