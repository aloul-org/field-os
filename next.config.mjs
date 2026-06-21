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
    // Puppeteer / heavy server-only deps are kept out of the client bundle.
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default withNextIntl(nextConfig);
