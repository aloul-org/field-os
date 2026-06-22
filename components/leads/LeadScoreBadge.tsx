import { Flame, ThermometerSun, Snowflake } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LeadScore } from "@/lib/types/database";

const SCORE_META: Record<
  LeadScore,
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: {
    label: "Hot",
    icon: Flame,
    className: "bg-destructive/10 text-destructive",
  },
  warm: {
    label: "Warm",
    icon: ThermometerSun,
    className: "bg-warning/15 text-warning",
  },
  cold: {
    label: "Cold",
    icon: Snowflake,
    className: "bg-muted text-muted-foreground",
  },
};

/** Calm pill (tint background, not full-saturation) per the design system. */
export function LeadScoreBadge({
  score,
  className,
}: {
  score: LeadScore | null;
  className?: string;
}) {
  if (!score) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-pill bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        Scoring…
      </span>
    );
  }
  const meta = SCORE_META[score];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
