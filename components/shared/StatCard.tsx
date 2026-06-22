import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const ICON_TONE_CLASS = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const ICON_WRAP_TONE_CLASS = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

type Tone = "default" | "success" | "warning" | "destructive";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  size = "default",
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  /** "hero" is the single larger bento stat per dashboard — see design-prompt.md. */
  size?: "default" | "hero";
  className?: string;
}) {
  if (size === "hero") {
    return (
      <Card className={cn("flex flex-col justify-between", className)}>
        <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {Icon && (
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  ICON_WRAP_TONE_CLASS[tone]
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>
          <p className="font-display text-4xl font-bold tracking-tight">{value}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
        {Icon && <Icon className={cn("h-5 w-5", ICON_TONE_CLASS[tone])} aria-hidden="true" />}
      </CardContent>
    </Card>
  );
}
