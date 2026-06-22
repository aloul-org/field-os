"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Prev / Today / Next + a date picker, driving the ?date= query param. */
export function ScheduleDayNav({ date }: { date: string }) {
  const router = useRouter();

  function go(next: string) {
    router.push(`/schedule?date=${next}`);
  }

  function shift(days: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    go(d.toISOString().slice(0, 10));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="h-9 rounded-sm border bg-background px-3 text-sm"
      />
      {date !== today && (
        <Button variant="ghost" size="sm" onClick={() => go(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
