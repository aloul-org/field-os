import { FileText } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Estimates" };

export default async function EstimatesPage() {
  await requireSection("estimates");
  return <ModulePlaceholder title="Estimates" icon={FileText} phase="Phase 2" />;
}
