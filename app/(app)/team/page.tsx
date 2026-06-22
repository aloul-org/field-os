import { UsersRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { InviteMemberDialog, MemberRow } from "@/components/team/TeamManager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const ctx = await requireSection("team");
  const supabase = createClient();
  const canManage = ctx.role === "owner" || ctx.role === "admin";

  const { data: members } = await supabase
    .from("team_members")
    .select("id, name, email, role, is_active, invite_accepted_at")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: true });

  const rows = (members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    is_active: m.is_active,
    accepted: Boolean(m.invite_accepted_at),
  }));

  return (
    <div>
      <PageHeader
        title="Team"
        description="Invite people, set what they can access, and manage who's active."
        action={canManage ? <InviteMemberDialog /> : null}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Just you so far"
          description="Invite technicians, dispatchers and office staff to work together in FieldOS."
          action={canManage ? <InviteMemberDialog /> : null}
        />
      ) : (
        <Card>
          <CardContent className="space-y-2 p-4">
            {rows.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
