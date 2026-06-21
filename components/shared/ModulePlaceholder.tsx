import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * Temporary landing for modules that ship in a later phase. Keeps every sidebar
 * destination reachable (and role-gated) while the build progresses phase by phase.
 */
export function ModulePlaceholder({
  title,
  icon,
  phase,
}: {
  title: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={icon}
        title={`${title} is coming next`}
        description={`This module is built in ${phase}. The data model, navigation and access control for it are already in place.`}
      />
    </div>
  );
}
