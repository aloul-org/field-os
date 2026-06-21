"use server";

import { createClient } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/i18n/actions";
import { regionVatRate } from "@/i18n/config";
import {
  createCompanySchema,
  type CreateCompanyInput,
} from "@/lib/validations/onboarding";

type Result =
  | { ok: true; destination: string }
  | { ok: false; error: string };

/**
 * Final onboarding step. Creates the company, the owner's team_members row
 * (role 'owner', auto-accepted), and any invited members (pending). Invites are
 * actually sent in Module/Phase 6 — here we persist the rows so the team list
 * is populated. All money/VAT defaults are derived server-side from region.
 */
export async function createCompanyAction(
  raw: CreateCompanyInput
): Promise<Result> {
  const parsed = createCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Some details are missing — please review." };
  }
  const input = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  // Guard against double-submit: if the user already has a company, just go in.
  const { data: existing } = await supabase
    .from("team_members")
    .select("company_id")
    .eq("user_id", user.id)
    .not("invite_accepted_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, destination: "/dashboard" };

  const region = input.company.region;
  const timezone = region === "DE" ? "Europe/Berlin" : "Europe/London";

  // 1. Company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      business_name: input.company.business_name,
      owner_user_id: user.id,
      trade: input.trade.trade,
      email: user.email ?? input.company.business_name,
      phone: input.company.phone || null,
      address: input.company.address || null,
      region,
      timezone,
      language: input.company.language,
      company_size: input.trade.company_size,
      vat_rate: regionVatRate[region],
      vat_registered: input.pricing.vat_registered,
      vat_number: input.pricing.vat_number || null,
      default_hourly_rate: input.pricing.default_hourly_rate ?? null,
      default_call_out_fee: input.pricing.default_call_out_fee ?? null,
      payment_terms_days: input.pricing.payment_terms_days,
      subscription_plan: input.plan,
      subscription_status: "trialing",
    })
    .select("id, language")
    .single();

  if (companyError || !company) {
    return { ok: false, error: "Could not create your company. Please try again." };
  }

  // 2. Owner team_members row (auto-accepted) — must exist before invited rows
  //    so the RLS write policy (owner/admin) recognises this user.
  const { error: ownerError } = await supabase.from("team_members").insert({
    company_id: company.id,
    user_id: user.id,
    name: input.company.owner_name,
    email: user.email ?? "",
    role: "owner",
    invite_accepted_at: new Date().toISOString(),
  });

  if (ownerError) {
    return { ok: false, error: "Could not set up your account. Please try again." };
  }

  // 3. Invited members (pending acceptance)
  if (input.team.length > 0) {
    const rows = input.team.map((m) => ({
      company_id: company.id,
      name: m.name,
      email: m.email,
      role: m.role,
    }));
    // Non-fatal if this fails — the owner can re-invite from /team.
    await supabase.from("team_members").insert(rows);
  }

  await setLocaleCookie(company.language);
  return { ok: true, destination: "/dashboard" };
}
