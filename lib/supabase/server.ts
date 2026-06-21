import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Bound to the request's cookie store so RLS sees the authenticated user.
 *
 * In a pure Server Component (read-only render) cookie writes are not allowed;
 * we swallow that specific case so session refresh in middleware remains the
 * single place responsible for persisting refreshed tokens.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore; the
            // session is refreshed in middleware instead.
          }
        },
      },
    }
  );
}

/**
 * Service-role client that bypasses RLS. ONLY for trusted server contexts:
 * cron jobs, webhooks, and the background queue processor. Never expose this to
 * the browser and never derive the acting company from user input without an
 * explicit company_id check.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
