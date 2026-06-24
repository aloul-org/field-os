import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/auth/session";
import { accessibleSections } from "@/lib/auth/roles";
import { visibleNavItems } from "@/components/layout/nav-items";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireContext();

  // Technicians live in the /tech PWA, not the office app.
  if (ctx.role === "technician") redirect("/tech/today");

  const isSolo = ctx.company.company_size === "solo";
  const items = visibleNavItems(accessibleSections(ctx.role), isSolo);

  // Unread notification count for the bell (best-effort).
  const supabase = createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          companyName={ctx.company.business_name}
          userName={ctx.member.name}
          userEmail={ctx.member.email}
          role={ctx.role}
          avatarUrl={ctx.member.avatar_url}
          unread={count ?? 0}
        />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileNav items={items} />
      </div>
    </div>
  );
}
