"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/** Finds the closest internal-navigation anchor for a click target, or null if
 * this click won't trigger an App Router navigation (new tab, external, hash, etc). */
function internalHrefFromClick(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const anchor = (e.target as HTMLElement)?.closest("a");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname + url.search === window.location.pathname + window.location.search) return null;

  return url.pathname + url.search;
}

function TopLoaderBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (internalHrefFromClick(e)) start();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function start() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setVisible(true);
    setProgress(12);
    if (tickRef.current) clearInterval(tickRef.current);
    // Trickles toward 85% and waits there — the pathname effect below snaps it
    // to 100% the moment the new route actually lands.
    tickRef.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + (85 - p) * 0.1 : p));
    }, 150);
  }

  function finish() {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
    setProgress(100);
    window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }

  // Route (or query) actually changed — the navigation this bar was tracking is done.
  useEffect(() => {
    finish();
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(255,90,31,0.55)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/** Orange progress bar that runs while the App Router navigates between pages,
 * since Next 14 has no built-in route-change events to hook a loader off. */
export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderBar />
    </Suspense>
  );
}
