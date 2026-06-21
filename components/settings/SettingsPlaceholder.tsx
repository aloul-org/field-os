import { Settings2 } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

/**
 * Stub for settings sub-pages whose backing module ships in a later phase. Keeps
 * the settings sub-nav navigable without dead links.
 */
export function SettingsPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState icon={Settings2} title={title} description={description} />
  );
}
