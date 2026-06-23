"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Offline indicator for the technician PWA (spec Module 7). The service worker
 * serves the last-viewed pages offline; this banner makes the state visible and
 * reassures that photo/voice uploads will be retried when back online.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground">
      <WifiOff className="h-4 w-4" />
      You&apos;re offline — showing your saved jobs. Photos &amp; reports will upload when you&apos;re back online.
    </div>
  );
}
