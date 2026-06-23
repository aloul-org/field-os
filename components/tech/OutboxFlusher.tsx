"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

import { count, flush } from "@/lib/tech/outbox";

/**
 * Drains the offline upload outbox when the device regains connectivity (spec
 * Module 7). Runs on mount and on every `online` event; shows a small badge
 * while uploads are pending so the technician knows nothing was lost.
 */
export function OutboxFlusher() {
  const router = useRouter();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let active = true;

    async function drain() {
      const before = await count();
      if (!active) return;
      setPending(before);
      if (before === 0 || !navigator.onLine) return;
      const { sent, remaining } = await flush();
      if (!active) return;
      setPending(remaining);
      if (sent > 0) router.refresh();
    }

    drain();
    window.addEventListener("online", drain);
    return () => {
      active = false;
      window.removeEventListener("online", drain);
    };
  }, [router]);

  if (pending === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-muted px-4 py-2 text-sm shadow-card">
      <span className="flex items-center gap-2 text-muted-foreground">
        <UploadCloud className="h-4 w-4" />
        {pending} upload{pending > 1 ? "s" : ""} waiting for signal…
      </span>
    </div>
  );
}
