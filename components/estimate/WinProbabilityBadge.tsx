import { Badge } from "@/components/ui/badge";

/**
 * Win-probability badge — contractor-only, never shown to the customer.
 * green ≥70%, amber 40–69%, red <40% (Module 5).
 */
export function WinProbabilityBadge({
  probability,
  factors,
}: {
  probability: number | null;
  factors?: string[];
}) {
  if (probability == null) return null;
  const variant =
    probability >= 70 ? "success" : probability >= 40 ? "warning" : "destructive";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={variant}>Win probability: {probability}%</Badge>
      </div>
      {factors && factors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {factors.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
