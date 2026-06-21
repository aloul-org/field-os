"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PickedCustomer {
  id: string;
  name: string;
  propertyId?: string | null;
}

/** Searchable single-customer picker, backed by the browser Supabase client. */
export function CustomerPicker({
  value,
  onChange,
}: {
  value: PickedCustomer | null;
  onChange: (c: PickedCustomer | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const handle = setTimeout(async () => {
      let q = supabase
        .from("customers")
        .select("id, name, properties(id)")
        .order("name")
        .limit(20);
      if (query.trim()) q = q.ilike("name", `%${query.replace(/[%,]/g, " ")}%`);
      const { data } = await q;
      setResults(
        (data ?? []).map((c) => {
          const props = c.properties as unknown as { id: string }[] | null;
          return {
            id: c.id,
            name: c.name,
            propertyId: props?.[0]?.id ?? null,
          };
        })
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          {value ? value.name : "Select a customer…"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] p-0" align="start">
        <div className="relative border-b p-2">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-8"
            placeholder="Search customers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              No customers found.
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value?.id === c.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {c.name}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
