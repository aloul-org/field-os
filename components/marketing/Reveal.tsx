"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades/rises its children into view on scroll (IntersectionObserver). Respects
 * prefers-reduced-motion by showing immediately. Pure CSS transition — light.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Direction the content slides in from. */
  from?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden =
    from === "left"
      ? "-translate-x-8 opacity-0"
      : from === "right"
        ? "translate-x-8 opacity-0"
        : "translate-y-6 opacity-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        shown ? "translate-x-0 translate-y-0 opacity-100" : hidden,
        className
      )}
    >
      {children}
    </div>
  );
}
