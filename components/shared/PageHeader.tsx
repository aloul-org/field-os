export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  /** Small uppercase label above the title (optional). */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-stretch gap-3">
        {/* Route accent — a stop on the brand's line, marking this section. */}
        <span
          aria-hidden="true"
          className="mt-0.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-primary/30"
        />
        <div className="space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
