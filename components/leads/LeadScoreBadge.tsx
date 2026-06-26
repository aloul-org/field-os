import { Flame, ThermometerSun, Snowflake } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { LeadScore } from "@/lib/types/database";

const SCORE_META: Record<LeadScore, { icon: typeof Flame; className: string }> = {
  hot: {
    icon: Flame,
    className: "bg-destructive/10 text-destructive",
  },
  warm: {
    icon: ThermometerSun,
    className: "bg-warning/15 text-warning",
  },
  cold: {
    icon: Snowflake,
    className: "bg-muted text-muted-foreground",
  },
};

/** Calm pill (tint background, not full-saturation) per the design system. */
export async function LeadScoreBadge({
  score,
  className,
}: {
  score: LeadScore | null;
  className?: string;
}) {
  const t = await getTranslations("leads");
  if (!score) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-pill bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        {t("scoring")}
      </span>
    );
  }
  const meta = SCORE_META[score];
  const Icon = meta.icon;
  const labelKey =
    score === "hot" ? "scoreHot" : score === "warm" ? "scoreWarm" : "scoreCold";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(labelKey)}
    </span>
  );
}
