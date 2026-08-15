import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;
type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Shared by the platform-admin server actions
 * (app/(platform)/admin/companies/actions.ts). `supabase` must be a
 * service-role client (lib/supabase/server.ts createAdminClient) — these
 * operations cross tenant boundaries on purpose, after the caller has already
 * verified the acting user via requirePlatformAdmin().
 */
export async function suspendCompanyCore(
  supabase: Client,
  companyId: string,
  reason: string
): Promise<Result> {
  const { error } = await supabase
    .from("companies")
    .update({
      platform_status: "suspended",
      suspended_at: new Date().toISOString(),
      suspended_reason: reason || null,
    })
    .eq("id", companyId);
  if (error) return { ok: false, error: "Could not suspend the company." };
  return { ok: true, data: undefined };
}

export async function reactivateCompanyCore(
  supabase: Client,
  companyId: string
): Promise<Result> {
  const { error } = await supabase
    .from("companies")
    .update({
      platform_status: "active",
      suspended_at: null,
      suspended_reason: null,
    })
    .eq("id", companyId);
  if (error) return { ok: false, error: "Could not reactivate the company." };
  return { ok: true, data: undefined };
}
