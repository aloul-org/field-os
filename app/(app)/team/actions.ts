"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";
import { sendMessage } from "@/lib/messaging/sms";
import {
  inviteMemberSchema,
  updateRoleSchema,
  type InviteMemberInput,
  type UpdateRoleInput,
} from "@/lib/validations/team";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const DENIED = "Only owners and admins can manage the team.";

/** Owners and admins only — RLS allows the write, this gates the UI capability. */
function canManageTeam(role: string): boolean {
  return role === "owner" || role === "admin";
}

export async function inviteMember(
  input: InviteMemberInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("team");
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }
  const d = parsed.data;
  const supabase = createClient();

  // Reject duplicates within the company.
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("company_id", ctx.company.id)
    .eq("email", d.email)
    .maybeSingle();
  if (existing) return { ok: false, error: "Someone with that email is already on the team." };

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      company_id: ctx.company.id,
      name: d.name,
      email: d.email,
      role: d.role,
      phone: d.phone || null,
      is_active: true,
      // invite_token defaults in the DB; invite_accepted_at stays null until accept.
    })
    .select("id, invite_token")
    .single();
  if (error || !member) return { ok: false, error: "Could not create the invite." };

  const inviteUrl = `${publicEnv.appUrl}/auth/accept-invite?token=${member.invite_token}`;
  // Best-effort delivery — the office can also copy the link.
  await sendEmail({
    to: d.email,
    subject: `You've been invited to ${ctx.company.business_name} on FieldOS`,
    html: `<p>Hi ${d.name},</p><p>${ctx.company.business_name} has invited you to join their team on FieldOS.</p><p><a href="${inviteUrl}">Accept your invite</a></p>`,
  });
  // Technicians live in the phone app — text them the link too if we have a number.
  if (d.role === "technician" && d.phone) {
    await sendMessage({
      to: d.phone,
      channel: "sms",
      body: `${ctx.company.business_name} invited you to FieldOS. Accept and install the app: ${inviteUrl}`,
    });
  }

  revalidatePath("/team");
  return { ok: true, data: { id: member.id } };
}

export async function updateMemberRole(input: UpdateRoleInput): Promise<Result> {
  const ctx = await requireSection("team");
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = createClient();
  const { data: member } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("id", parsed.data.memberId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.role === "owner") {
    return { ok: false, error: "The owner's role can't be changed." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not update the role." };

  revalidatePath("/team");
  return { ok: true, data: undefined };
}

export async function setMemberActive(
  memberId: string,
  isActive: boolean
): Promise<Result> {
  const ctx = await requireSection("team");
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

  const supabase = createClient();
  const { data: member } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.role === "owner") {
    return { ok: false, error: "The owner can't be deactivated." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ is_active: isActive })
    .eq("id", memberId)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not update the team member." };

  revalidatePath("/team");
  return { ok: true, data: undefined };
}
