"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { setLocaleCookie } from "@/i18n/actions";
import {
  companySettingsSchema,
  type CompanySettingsInput,
} from "@/lib/validations/settings";

type Result = { ok: true } | { ok: false; error: string };

export async function updateCompany(
  input: CompanySettingsInput
): Promise<Result> {
  const ctx = await requireSection("settings");
  if (!canWrite(ctx.role)) {
    return { ok: false, error: "You don't have permission to change settings." };
  }

  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  const d = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      business_name: d.business_name,
      email: d.email,
      phone: d.phone || null,
      address: d.address || null,
      default_hourly_rate: d.default_hourly_rate ?? null,
      default_call_out_fee: d.default_call_out_fee ?? null,
      vat_registered: d.vat_registered,
      vat_number: d.vat_number || null,
      payment_terms_days: d.payment_terms_days,
      monthly_overhead: d.monthly_overhead ?? 0,
      language: d.language,
    })
    .eq("id", ctx.company.id);

  if (error) return { ok: false, error: "Could not save settings." };

  // Keep the UI locale in sync if the company language changed.
  if (d.language !== ctx.company.language) {
    await setLocaleCookie(d.language);
  }

  revalidatePath("/settings");
  return { ok: true };
}

/** Toggle the embeddable website lead-capture widget on/off. */
export async function setWidgetEnabled(enabled: boolean): Promise<Result> {
  const ctx = await requireSection("settings");
  if (!canWrite(ctx.role)) {
    return { ok: false, error: "You don't have permission to change settings." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("companies")
    .update({ widget_enabled: enabled })
    .eq("id", ctx.company.id);

  if (error) return { ok: false, error: "Could not update the widget." };

  revalidatePath("/settings/lead-capture");
  return { ok: true };
}
