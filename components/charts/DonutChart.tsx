import { cn } from "@/lib/utils";

export type Segment = { label: string; value: number; color: string };

/** SVG donut with a legend. Colours are passed as CSS colour strings
 * (e.g. "hsl(var(--success))") and applied inline. */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  className,
}: {
  segments: Segment[];
  centerValue: string;
  centerLabel?: string;
  className?: string;
}) {
  const size = 150;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 animate-scale-in"
        role="img"
        aria-label="Breakdown by status"
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
          {segments.map((s) => {
            const len = (s.value / total) * C;
            const node = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
              />
            );
            acc += len;
            return node;
          })}
        </g>
        <text
          x={size / 2}
          y={size / 2 - 1}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-display)" }}
        >
          {centerValue}
        </text>
        {centerLabel && (
          <text
            x={size / 2}
            y={size / 2 + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "10px" }}
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
