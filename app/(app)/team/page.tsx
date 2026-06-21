import { UsersRound } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  await requireSection("team");
  return <ModulePlaceholder title="Team" icon={UsersRound} phase="Phase 6" />;
}
