import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { publicEnv } from "@/lib/env";
import { Toaster } from "@/components/ui/toaster";
import { TopLoader } from "@/components/layout/TopLoader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${publicEnv.appName} — Run your service company with AI`,
    template: `%s · ${publicEnv.appName}`,
  },
  description:
    "FieldOS AI is an AI operating system for field service companies — it answers the phone, books the job, schedules the technician, writes the estimate and chases the invoice.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Locale + messages come from i18n/request.ts (cookie-driven, no URL prefix).
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TopLoader />
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
