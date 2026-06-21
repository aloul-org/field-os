import { Package } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Materials" };

export default async function MaterialsPage() {
  await requireSection("materials");
  return <ModulePlaceholder title="Materials" icon={Package} phase="Phase 4" />;
}
