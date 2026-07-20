import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActiveContext } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";
import { sendMessage } from "@/lib/messaging/sms";
import type { Database } from "@/lib/types/database";
import type { InviteMemberInput, UpdateRoleInput } from "@/lib/validations/team";

type Client = SupabaseClient<Database>;
type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const DENIED = "Only owners and admins can manage the team.";

/** Owners and admins only — RLS allows the write, this gates the UI capability. */
export function canManageTeam(role: string): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Shared by the web server actions (app/(app)/team/actions.ts) and the
 * mobile Bearer route (/api/team) so the two can't drift.
 */
export async function inviteMemberCore(
  supabase: Client,
  ctx: ActiveContext,
  input: InviteMemberInput
): Promise<Result<{ id: string }>> {
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("company_id", ctx.company.id)
    .eq("email", input.email)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "Someone with that email is already on the team." };
  }

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      company_id: ctx.company.id,
      name: input.name,
      email: input.email,
      role: input.role,
      phone: input.phone || null,
      is_active: true,
    })
    .select("id, invite_token")
    .single();
  if (error || !member) return { ok: false, error: "Could not create the invite." };

  const inviteUrl = `${publicEnv.appUrl}/auth/accept-invite?token=${member.invite_token}`;
  await sendEmail({
    to: input.email,
    subject: `You've been invited to ${ctx.company.business_name} on FieldOS`,
    html: `<p>Hi ${input.name},</p><p>${ctx.company.business_name} has invited you to join their team on FieldOS.</p><p><a href="${inviteUrl}">Accept your invite</a></p>`,
  });
  if (input.role === "technician" && input.phone) {
    await sendMessage({
      to: input.phone,
      channel: "sms",
      body: `${ctx.company.business_name} invited you to FieldOS. Accept and install the app: ${inviteUrl}`,
    });
  }

  return { ok: true, data: { id: member.id } };
}

export async function updateMemberRoleCore(
  supabase: Client,
  ctx: ActiveContext,
  input: UpdateRoleInput
): Promise<Result> {
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

  const { data: member } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("id", input.memberId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!member) return { ok: false, error: "Team member not found." };
  if (member.role === "owner") {
    return { ok: false, error: "The owner's role can't be changed." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: input.role })
    .eq("id", input.memberId)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not update the role." };

  return { ok: true, data: undefined };
}

export async function setMemberActiveCore(
  supabase: Client,
  ctx: ActiveContext,
  memberId: string,
  isActive: boolean
): Promise<Result> {
  if (!canManageTeam(ctx.role)) return { ok: false, error: DENIED };

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

  return { ok: true, data: undefined };
}
