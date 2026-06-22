import { LogOut, CheckCircle2, Mail, Phone } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/session";
import { logout } from "@/app/(app)/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";

export const metadata = { title: "Profile" };

export default async function TechProfilePage() {
  const ctx = await requireTechnician();
  const supabase = createClient();

  // Jobs this technician has completed (via their completed appointments).
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("company_id", ctx.company.id)
    .eq("assigned_technician_id", ctx.member.id)
    .eq("status", "completed");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold tracking-tight">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {initials(ctx.member.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{ctx.member.name}</p>
            <p className="truncate text-sm text-muted-foreground">{ctx.company.business_name}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div>
            <p className="text-2xl font-bold">{count ?? 0}</p>
            <p className="text-sm text-muted-foreground">Jobs completed</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> {ctx.member.email}
          </p>
          {ctx.member.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> {ctx.member.phone}
            </p>
          )}
        </CardContent>
      </Card>

      <form action={logout}>
        <Button type="submit" variant="outline" className="h-12 w-full">
          <LogOut className="h-5 w-5" /> Log out
        </Button>
      </form>
    </div>
  );
}
