import { CalendarDays } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  await requireSection("schedule");
  return (
    <ModulePlaceholder title="Schedule" icon={CalendarDays} phase="Phase 4" />
  );
}
