"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import {
  suspendCompanyCore,
  reactivateCompanyCore,
} from "@/lib/admin/manage-companies";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function suspendCompany(
  companyId: string,
  reason: string
): Promise<Result> {
  await requirePlatformAdmin();
  const result = await suspendCompanyCore(createAdminClient(), companyId, reason);
  if (result.ok) revalidatePath(`/admin/companies/${companyId}`);
  return result;
}

export async function reactivateCompany(companyId: string): Promise<Result> {
  await requirePlatformAdmin();
  const result = await reactivateCompanyCore(createAdminClient(), companyId);
  if (result.ok) revalidatePath(`/admin/companies/${companyId}`);
  return result;
}
