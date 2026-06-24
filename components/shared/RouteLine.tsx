import { cn } from "@/lib/utils";

/**
 * The brand's signature Route Line, as a slim decorative band: a line that
 * draws itself in with stop markers and a pulse travelling along it — the
 * visual idea of "an AI that sequences your day". Decorative only.
 */
export function RouteLine({ className }: { className?: string }) {
  const stops = [8, 138, 268, 392];
  return (
    <svg
      viewBox="0 0 400 16"
      className={cn("h-4 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Base + drawn-in accent line */}
      <line x1="8" y1="8" x2="392" y2="8" className="stroke-border" strokeWidth="1.5" />
      <line
        x1="8"
        y1="8"
        x2="392"
        y2="8"
        pathLength={1}
        className="route-draw stroke-primary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Stop markers */}
      {stops.map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="8"
          r={i === 0 ? 3.5 : 3}
          className={i === 0 ? "fill-primary" : "fill-card stroke-primary"}
          strokeWidth="1.5"
        />
      ))}
      {/* Travelling pulse */}
      <circle r="3" cy="8" className="fill-primary">
        <animate attributeName="cx" from="8" to="392" dur="3.2s" repeatCount="indefinite" />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          dur="3.2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
