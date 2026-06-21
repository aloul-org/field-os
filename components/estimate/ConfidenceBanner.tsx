import { AlertTriangle, Info } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shows the AI's confidence and any flags the contractor should double-check. */
export function ConfidenceBanner({
  confidence,
  flags,
}: {
  confidence: "high" | "medium" | "low" | null;
  flags: string[];
}) {
  if (!confidence && flags.length === 0) return null;

  const tone =
    confidence === "low"
      ? "border-warning/40 bg-warning/10"
      : "border-border bg-muted/50";

  return (
    <div className={cn("rounded-lg border p-3 text-sm", tone)}>
      <div className="flex items-center gap-2 font-medium">
        {confidence === "low" ? (
          <AlertTriangle className="h-4 w-4 text-warning" />
        ) : (
          <Info className="h-4 w-4 text-muted-foreground" />
        )}
        AI confidence: {confidence ?? "—"}
      </div>
      {flags.length > 0 && (
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {flags.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
