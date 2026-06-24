import { cn } from "@/lib/utils";

/** A single-value progress ring with a big percentage in the centre. */
export function RadialGauge({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const size = 150;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const len = (pct / 100) * C;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-scale-in"
        role="img"
        aria-label={`${pct}%`}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-muted"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-primary"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${len} ${C - len}`}
          />
        </g>
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: "30px", fontWeight: 700, fontFamily: "var(--font-display)" }}
        >
          {pct}%
        </text>
      </svg>
      {label && <p className="mt-1 text-center text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
