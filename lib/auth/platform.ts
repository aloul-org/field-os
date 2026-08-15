import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";

/**
 * Whether the current user is a platform operator (distinct from any
 * per-company TeamRole). Checked on the normal cookie-bound client — a user
 * can only ever read their own platform_admins row, so this needs no
 * elevated privilege. Cached per request.
 */
export const getPlatformAdmin = cache(async (): Promise<User | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
});

/** Require a platform operator; redirect to /login or /no-access otherwise. */
export async function requirePlatformAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const admin = await getPlatformAdmin();
  if (!admin) redirect("/no-access");

  return admin;
}
