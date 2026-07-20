"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import {
  inviteMemberCore,
  updateMemberRoleCore,
  setMemberActiveCore,
} from "@/lib/team/manage-team";
import {
  inviteMemberSchema,
  updateRoleSchema,
  type InviteMemberInput,
  type UpdateRoleInput,
} from "@/lib/validations/team";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function inviteMember(
  input: InviteMemberInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("team");
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }

  const result = await inviteMemberCore(createClient(), ctx, parsed.data);
  if (result.ok) revalidatePath("/team");
  return result;
}

export async function updateMemberRole(input: UpdateRoleInput): Promise<Result> {
  const ctx = await requireSection("team");
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const result = await updateMemberRoleCore(createClient(), ctx, parsed.data);
  if (result.ok) revalidatePath("/team");
  return result;
}

export async function setMemberActive(
  memberId: string,
  isActive: boolean
): Promise<Result> {
  const ctx = await requireSection("team");
  const result = await setMemberActiveCore(createClient(), ctx, memberId, isActive);
  if (result.ok) revalidatePath("/team");
  return result;
}
