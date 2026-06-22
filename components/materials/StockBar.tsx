import { cn } from "@/lib/utils";

/** Stock-level bar: red at/below the reorder threshold, else neutral. */
export function StockBar({
  onHand,
  threshold,
}: {
  onHand: number;
  threshold: number;
}) {
  const low = onHand <= threshold;
  // Scale the bar against 2× the threshold (or onHand if higher) for a sensible full point.
  const max = Math.max(threshold * 2, onHand, 1);
  const pct = Math.min(100, Math.round((onHand / max) * 100));

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-pill bg-muted">
        <div
          className={cn("h-full rounded-pill", low ? "bg-destructive" : "bg-success")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn("text-xs", low ? "font-medium text-destructive" : "text-muted-foreground")}>
        {onHand} on hand{low ? " · reorder" : ""} (threshold {threshold})
      </p>
    </div>
  );
}
