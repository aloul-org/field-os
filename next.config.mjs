import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withNextIntl(nextConfig);
