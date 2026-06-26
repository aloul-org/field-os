import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const ICON_WRAP_TONE_CLASS = {
  default: "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-inset ring-primary/15",
  success: "bg-gradient-to-br from-success/25 via-success/10 to-transparent text-success ring-1 ring-inset ring-success/15",
  warning: "bg-gradient-to-br from-warning/25 via-warning/10 to-transparent text-warning ring-1 ring-inset ring-warning/15",
  destructive: "bg-gradient-to-br from-destructive/25 via-destructive/10 to-transparent text-destructive ring-1 ring-inset ring-destructive/15",
};

const HERO_WASH_TONE_CLASS = {
  default: "from-primary/5",
  success: "from-success/10",
  warning: "from-warning/10",
  destructive: "from-destructive/10",
};

type Tone = "default" | "success" | "warning" | "destructive";

const HOVER_LIFT =
  "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  size = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  /** "hero" is the single larger bento stat per dashboard — see design-prompt.md. */
  size?: "default" | "hero";
  className?: string;
}) {
  if (size === "hero") {
    return (
      <Card
        className={cn(
          "flex flex-col justify-between overflow-hidden bg-gradient-to-br to-transparent",
          HERO_WASH_TONE_CLASS[tone],
          HOVER_LIFT,
          className
        )}
      >
        <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {Icon && (
              <span
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm",
                  ICON_WRAP_TONE_CLASS[tone]
                )}
              >
                <Icon className="h-5 w-5 drop-shadow-sm" aria-hidden="true" strokeWidth={2.25} />
              </span>
            )}
          </div>
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(HOVER_LIFT, className)}>
      <CardContent className="flex items-center gap-4 p-4">
        {Icon && (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm",
              ICON_WRAP_TONE_CLASS[tone]
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2.25} />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
