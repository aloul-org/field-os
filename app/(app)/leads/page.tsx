import { Inbox } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  await requireSection("leads");
  return <ModulePlaceholder title="Leads" icon={Inbox} phase="Phase 3" />;
}
