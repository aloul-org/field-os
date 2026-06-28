"use server";

import { createClient } from "@/lib/supabase/server";
import { setLocaleCookie } from "@/i18n/actions";
import { homeDestination } from "@/lib/auth/roles";

/**
 * Called right after a successful client-side sign-in. Syncs the UI locale to
 * the company's `language` setting and reports where to send the user next
 * (the app if onboarded, onboarding otherwise).
 */
export async function completeLogin(): Promise<{ destination: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { destination: "/login" };

  const { data: member } = await supabase
    .from("team_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .not("invite_accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (!member) return { destination: "/onboarding/company" };

  const { data: company } = await supabase
    .from("companies")
    .select("language")
    .eq("id", member.company_id)
    .single();

  if (company?.language) {
    await setLocaleCookie(company.language);
  }

  // Land on the headline feature (estimate builder) where the role allows it;
  // technicians go to the field PWA, dispatchers to the dashboard.
  return { destination: homeDestination(member.role) };
}
