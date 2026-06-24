import { cn } from "@/lib/utils";

/** Lightweight SVG area chart — a gradient fill under a self-drawing line.
 * No charting dependency; pure SVG so it renders on the server. */
export function AreaChart({
  data,
  className,
}: {
  data: { label: string; value: number }[];
  className?: string;
}) {
  const W = 340;
  const H = 140;
  const P = 10;
  const BASE = H - 24; // leave room for month labels
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const x = (i: number) => (n <= 1 ? P : P + (i * (W - 2 * P)) / (n - 1));
  const y = (v: number) => P + (1 - v / max) * (BASE - P);
  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${BASE} L${x(0).toFixed(1)},${BASE} Z`;
  const last = data[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("w-full animate-scale-in", className)}
      role="img"
      aria-label="Revenue trend over the last six months"
    >
      <defs>
        <linearGradient id="fos-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={P} y1={BASE} x2={W - P} y2={BASE} className="stroke-border" strokeWidth="1" />
      <path d={area} fill="url(#fos-area)" />
      <path
        d={line}
        fill="none"
        className="route-draw stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
      {last && <circle cx={x(n - 1)} cy={y(last.value)} r="3.5" className="fill-primary" />}
      {data.map((d, i) => (
        <text
          key={`${d.label}-${i}`}
          x={x(i)}
          y={H - 7}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: "9px" }}
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}
