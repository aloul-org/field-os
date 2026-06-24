import { cn } from "@/lib/utils";

/** Labelled horizontal bars — a compact pipeline / distribution view. */
export function MiniBars({
  rows,
  className,
}: {
  rows: { label: string; value: number; color: string }[];
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
