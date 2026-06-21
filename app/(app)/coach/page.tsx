import { Bot } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Coach" };

export default async function CoachPage() {
  await requireSection("coach");
  return <ModulePlaceholder title="AI Business Coach" icon={Bot} phase="Phase 5" />;
}
