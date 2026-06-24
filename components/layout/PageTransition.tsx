"use client";

import { usePathname } from "next/navigation";

/**
 * Re-runs the page-enter animation on every route change by keying on the
 * pathname. The animation itself is disabled under prefers-reduced-motion
 * (see globals.css), so this degrades to an instant swap.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-slide-up-fade">
      {children}
    </div>
  );
}
