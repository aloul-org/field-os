"use client";

import { useState } from "react";

import { toggleChecklistItem } from "@/app/tech/actions";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  description: string;
  is_complete: boolean;
}

/** Large tappable checklist for the field — optimistic, with rollback on error. */
export function TechChecklist({ items }: { items: Item[] }) {
  const { toast } = useToast();
  const [state, setState] = useState(items);

  async function toggle(id: string, next: boolean) {
    setState((s) => s.map((i) => (i.id === id ? { ...i, is_complete: next } : i)));
    const res = await toggleChecklistItem(id, next);
    if (!res.ok) {
      setState((s) => s.map((i) => (i.id === id ? { ...i, is_complete: !next } : i)));
      toast({ variant: "destructive", description: res.error });
    }
  }

  if (state.length === 0) {
    return <p className="text-sm text-muted-foreground">No checklist for this job.</p>;
  }

  return (
    <ul className="space-y-2">
      {state.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => toggle(item.id, !item.is_complete)}
            className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left"
          >
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-md border-2",
                item.is_complete
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              )}
            >
              {item.is_complete && <Check className="h-5 w-5" />}
            </span>
            <span className={cn("text-base", item.is_complete && "text-muted-foreground line-through")}>
              {item.description}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
