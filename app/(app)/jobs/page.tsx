import { Briefcase } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  await requireSection("jobs");
  return <ModulePlaceholder title="Jobs" icon={Briefcase} phase="Phase 2" />;
}
