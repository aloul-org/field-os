import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { requirePlatformAdmin } from "@/lib/auth/platform";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-display text-lg font-bold"
            >
              <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
              FieldOS
            </Link>
            <AdminNav />
          </div>
          <Badge variant="destructive">Platform Admin</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}
