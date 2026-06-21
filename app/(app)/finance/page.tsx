import { TrendingUp } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Finance" };

export default async function FinancePage() {
  await requireSection("finance");
  return <ModulePlaceholder title="Finance" icon={TrendingUp} phase="Phase 5" />;
}
