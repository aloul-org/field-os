import { requireTechnician } from "@/lib/auth/session";
import { TechBottomNav } from "@/components/tech/TechBottomNav";
import { OfflineBanner } from "@/components/tech/OfflineBanner";
import { OutboxFlusher } from "@/components/tech/OutboxFlusher";

export const metadata = { title: "FieldOS — Field" };

/**
 * Technician PWA shell. Dark mode by default (field techs are often outdoors in
 * glare, per the design system), larger type/tap targets, bottom-tab navigation
 * only — no office sidebar. The `dark` class scopes dark mode to /tech/* without
 * affecting the light-only office app.
 */
export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTechnician();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <OfflineBanner />
      <OutboxFlusher />
      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-6 text-[1.05rem]">
        {children}
      </main>
      <TechBottomNav />
    </div>
  );
}
