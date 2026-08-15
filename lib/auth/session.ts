import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient, createBearerClient } from "@/lib/supabase/server";
import type {
  CompanyRow,
  Database,
  TeamMemberRow,
  TeamRole,
} from "@/lib/types/database";
import { canAccess, type AppSection } from "@/lib/auth/roles";

export interface ActiveContext {
  user: User;
  company: CompanyRow;
  member: TeamMemberRow;
  role: TeamRole;
}

/**
 * Resolve membership + company for an already-authenticated user. Shared by the
 * cookie and bearer flows so both derive the acting company identically.
 */
async function loadContext(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<ActiveContext | null> {
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

  return { user, company, member, role: member.role };
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

  return loadContext(supabase, user);
});

/** Extract a non-empty `Authorization: Bearer <jwt>` token, if present. */
function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice("bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Context for a bearer-authenticated (mobile) request. The JWT is verified by
 * Supabase via getUser(token) — an invalid or expired token yields null, never
 * a context.
 */
async function getBearerContext(
  token: string
): Promise<{ ctx: ActiveContext; supabase: SupabaseClient<Database> } | null> {
  const supabase = createBearerClient(token);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  const ctx = await loadContext(supabase, user);
  return ctx ? { ctx, supabase } : null;
}

/**
 * Route-handler variant of access control. Returns the context or an error tag
 * instead of redirecting (API routes return JSON errors, never HTML redirects).
 *
 * Pass `request` to additionally accept mobile's `Authorization: Bearer <jwt>`;
 * without it, only the cookie session is considered. The bearer path is tried
 * first so an explicit token always wins over any ambient cookie.
 *
 * IMPORTANT: use the returned `supabase` client for subsequent queries rather
 * than calling createClient() again — a bearer request carries no cookies, so a
 * cookie-bound client would run as anon and RLS would silently return nothing.
 */
export async function getRouteContext(
  section?: AppSection,
  request?: Request
): Promise<
  | { ctx: ActiveContext; supabase: SupabaseClient<Database> }
  | { error: "unauthorized" | "forbidden" }
> {
  const token = request ? bearerToken(request) : null;
  const resolved = token
    ? await getBearerContext(token)
    : await (async () => {
        const ctx = await getActiveContext();
        return ctx
          ? { ctx, supabase: createClient() as SupabaseClient<Database> }
          : null;
      })();

  if (!resolved) return { error: "unauthorized" };
  const { ctx } = resolved;

  if (ctx.company.platform_status === "suspended") return { error: "forbidden" };

  if (section && ctx.role !== "technician" && !canAccess(ctx.role, section)) {
    return { error: "forbidden" };
  }
  return resolved;
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
  if (ctx.company.platform_status === "suspended") redirect("/account-suspended");
  return ctx;
}

/**
 * Require a technician session for the /tech PWA. Non-technicians are sent to the
 * office app (they have no business in the field surface).
 */
export async function requireTechnician(): Promise<ActiveContext> {
  const ctx = await requireContext();
  if (ctx.role !== "technician") redirect("/dashboard");
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
