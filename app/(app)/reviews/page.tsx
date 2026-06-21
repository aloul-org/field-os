import { Star } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  await requireSection("reviews");
  return <ModulePlaceholder title="Reviews" icon={Star} phase="Phase 6" />;
}
