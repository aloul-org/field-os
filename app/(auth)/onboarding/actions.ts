"use server";

import { createClient } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/i18n/actions";
import { createCompanyCore } from "@/lib/onboarding/create-company";
import {
  createCompanySchema,
  type CreateCompanyInput,
} from "@/lib/validations/onboarding";

type Result =
  | { ok: true; destination: string }
  | { ok: false; error: string };

/**
 * Final onboarding step. Validates and delegates to createCompanyCore (shared
 * with the mobile Bearer route) then sets the locale cookie — a web-only
 * side-effect, which is why it lives here and not in the core.
 */
export async function createCompanyAction(
  raw: CreateCompanyInput
): Promise<Result> {
  const parsed = createCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Some details are missing — please review." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  const result = await createCompanyCore(supabase, user, parsed.data);
  if (!result.ok) return result;

  if (result.language) await setLocaleCookie(result.language);
  return { ok: true, destination: "/dashboard" };
}
