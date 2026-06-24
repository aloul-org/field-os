"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useCommandMenu } from "@/lib/stores/commandMenu";

/**
 * The search affordance in the top bar. Looks like a search field but opens the
 * ⌘K command palette. Shows the right modifier hint per platform.
 */
export function CommandTrigger() {
  const setOpen = useCommandMenu((s) => s.setOpen);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group flex h-9 items-center gap-2 rounded-lg border bg-background/60 px-3 text-sm text-muted-foreground",
        "transition-colors hover:border-primary/40 hover:text-foreground",
        "w-9 justify-center sm:w-full sm:max-w-xs sm:justify-start"
      )}
      aria-label="Search or jump to a page"
    >
      <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" aria-hidden="true" />
      <span className="hidden flex-1 text-left sm:inline">Search or jump to…</span>
      <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-flex">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
