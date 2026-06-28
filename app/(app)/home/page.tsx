import { redirect } from "next/navigation";

import { requireContext } from "@/lib/auth/session";
import { homeDestination } from "@/lib/auth/roles";

/**
 * Role-aware landing resolver. Sends each user to their home surface — the
 * estimate builder for estimating roles, the dashboard for dispatchers, the
 * field PWA for technicians. Used by the middleware when a signed-in user lands
 * on an auth screen, so the redirect can depend on role (which the edge
 * middleware itself doesn't load).
 */
export default async function HomeRedirectPage() {
  const ctx = await requireContext();
  redirect(homeDestination(ctx.role));
}
