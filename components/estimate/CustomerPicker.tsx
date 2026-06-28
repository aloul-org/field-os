"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerDialog } from "@/components/customers/CustomerDialog";

export interface PickedCustomer {
  id: string;
  name: string;
  propertyId?: string | null;
}

interface CustomerResult extends PickedCustomer {
  email: string | null;
  phone: string | null;
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
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const handle = setTimeout(async () => {
      let q = supabase
        .from("customers")
        .select("id, name, email, phone, properties(id)")
        .order("name")
        .limit(20);
      // Search across name, phone and email. Strip characters that would break
      // PostgREST's comma-separated `or` filter syntax.
      const term = query.trim().replace(/[%,()]/g, " ").trim();
      if (term) {
        q = q.or(
          `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`
        );
      }
      const { data } = await q;
      setResults(
        (data ?? []).map((c) => {
          const props = c.properties as unknown as { id: string }[] | null;
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            propertyId: props?.[0]?.id ?? null,
          };
        })
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <>
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
              placeholder="Search by name, phone or email…"
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
              results.map((c) => {
                const contact = [c.phone, c.email].filter(Boolean).join(" · ");
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        value?.id === c.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.name}</span>
                      {contact && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {contact}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
            >
              <UserPlus className="h-4 w-4" />
              Add new customer{query.trim() ? ` “${query.trim()}”` : ""}
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create-and-select inline: skips navigation, selects the new customer. */}
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultName={query.trim()}
        onCreated={(c) => {
          onChange({ id: c.id, name: c.name, propertyId: null });
          setDialogOpen(false);
        }}
      />
    </>
  );
}
