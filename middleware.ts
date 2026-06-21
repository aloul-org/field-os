import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Public path prefixes — reachable without authentication. Everything else
 * under (app)/(tech)/onboarding requires a session. Onboarding-state and
 * trial-paywall redirects are enforced in the (app) layout (which already loads
 * the company) to keep edge middleware free of per-request DB reads.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/auth",
  "/quote",
  "/invoice",
  "/portal",
  "/features",
  "/pricing",
  "/trades",
  "/about",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh the Supabase session on every request and learn who the user is.
  const { supabaseResponse, user } = await updateSession(request);

  // Signed-in users shouldn't sit on the auth screens.
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Gate non-public app routes behind authentication.
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  // Run on everything except Next internals, the API (handles its own auth),
  // and static asset file extensions.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|js|css|json|txt|xml|webmanifest)$).*)",
  ],
};
