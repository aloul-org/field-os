import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { homeDestination } from "@/lib/auth/roles";

/**
 * OAuth + email-link callback. Exchanges the auth code for a session, then
 * routes the user to the dashboard (existing company) or onboarding (new user).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Decide where to land: if the user already belongs to a company, go to the
  // app; otherwise start onboarding.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = redirectTo || "/dashboard";
  if (user) {
    const { data: member } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .not("invite_accepted_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (!member) {
      destination = "/onboarding/company";
    } else if (!redirectTo) {
      // No explicit return target → open the headline feature for this role.
      destination = homeDestination(member.role);
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
