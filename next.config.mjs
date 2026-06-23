import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Technician PWA (spec Module 7): caches the app shell + last-viewed pages so a
// technician with no signal still sees today's jobs. Disabled in dev so the
// service worker doesn't interfere with hot reload.
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Don't precache the build manifests; runtime caching handles navigations.
  buildExcludes: [/middleware-manifest\.json$/, /_buildManifest\.js$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage (logos, job photos served via public/signed URLs).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // Heavy server-only deps are kept out of the bundle (Chromium/Puppeteer must
    // load as external native modules at runtime).
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "puppeteer-core",
      "@sparticuz/chromium",
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
