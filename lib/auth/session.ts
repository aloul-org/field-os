import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { CompanyRow, TeamMemberRow, TeamRole } from "@/lib/types/database";
import { canAccess, type AppSection } from "@/lib/auth/roles";

export interface ActiveContext {
  user: User;
  company: CompanyRow;
  member: TeamMemberRow;
  role: TeamRole;
}

/** The authenticated user, or null. Cached per request. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Resolve the user's active company + their membership/role. Returns null when
 * the user is unauthenticated OR has no company yet (i.e. needs onboarding).
 * Cached per request so layouts and pages share a single round-trip.
 */
export const getActiveContext = cache(async (): Promise<ActiveContext | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .not("invite_accepted_at", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !member) return null;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", member.company_id)
    .single();

  if (companyError || !company) return null;

  return {
    user,
    company,
    member,
    role: member.role,
  };
});

/**
 * Route-handler variant of access control. Returns the context or null instead
 * of redirecting (API routes return JSON errors, never HTML redirects).
 */
export async function getRouteContext(
  section?: AppSection
): Promise<{ ctx: ActiveContext } | { error: "unauthorized" | "forbidden" }> {
  const ctx = await getActiveContext();
  if (!ctx) return { error: "unauthorized" };
  if (section && ctx.role !== "technician" && !canAccess(ctx.role, section)) {
    return { error: "forbidden" };
  }
  return { ctx };
}

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an authenticated user WITH a company. Redirects to /login if signed
 * out, or /onboarding/company if signed in but not yet onboarded.
 */
export async function requireContext(): Promise<ActiveContext> {
  const user = await getUser();
  if (!user) redirect("/login");
  const ctx = await getActiveContext();
  if (!ctx) redirect("/onboarding/company");
  return ctx;
}

/**
 * Require access to a section. Technicians are sent to their own app; other
 * roles without access render a friendly no-access page (handled by the caller
 * catching this redirect target).
 */
export async function requireSection(
  section: AppSection
): Promise<ActiveContext> {
  const ctx = await requireContext();
  if (ctx.role === "technician") redirect("/tech/today");
  if (!canAccess(ctx.role, section)) redirect("/no-access");
  return ctx;
}
