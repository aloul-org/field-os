import { Receipt } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  await requireSection("invoices");
  return <ModulePlaceholder title="Invoices" icon={Receipt} phase="Phase 2" />;
}
