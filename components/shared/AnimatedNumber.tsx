"use client";

import { useEffect, useRef, useState } from "react";

import { formatCurrency } from "@/lib/format";

type Kind = "currency" | "number" | "percent";

function format(value: number, kind: Kind, region: "UK" | "DE"): string {
  if (kind === "currency") return formatCurrency(Math.round(value), region);
  if (kind === "percent") return `${Math.round(value)}%`;
  return Math.round(value).toLocaleString(region === "DE" ? "de-DE" : "en-GB");
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to its value on mount. Serializable props only (no formatter
 * function) so it can be rendered from a Server Component. Snaps to the final
 * value under prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  kind = "number",
  region = "UK",
  durationMs = 750,
  className,
}: {
  value: number;
  kind?: Kind;
  region?: "UK" | "DE";
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number>();

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(from + (value - from) * easeOutCubic(progress));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className} suppressHydrationWarning>
      {format(display, kind, region)}
    </span>
  );
}
