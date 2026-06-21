import { Phone } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Calls" };

export default async function CallsPage() {
  await requireSection("calls");
  return <ModulePlaceholder title="Calls" icon={Phone} phase="Phase 3" />;
}
