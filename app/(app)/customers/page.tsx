import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Users, Plus, Building2, Home } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomerSearch } from "@/components/customers/CustomerSearch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Customers" };

function escapeLike(input: string): string {
  // Neutralise PostgREST/ilike wildcards and the comma that delimits or() args.
  return input.replace(/[,%()]/g, " ").trim();
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const ctx = await requireSection("customers");
  const supabase = createClient();
  const t = await getTranslations("customers");
  const q = escapeLike(searchParams.q ?? "");
  const writable = canWrite(ctx.role);

  let query = supabase
    .from("customers")
    .select("id, name, email, phone, customer_type, lifetime_value")
    .eq("company_id", ctx.company.id);

  if (q) {
    // Match direct customer fields, plus any customer with a matching property.
    const { data: propMatches } = await supabase
      .from("properties")
      .select("customer_id")
      .eq("company_id", ctx.company.id)
      .or(
        `address_line1.ilike.%${q}%,postcode.ilike.%${q}%,city.ilike.%${q}%`
      );
    const ids = Array.from(
      new Set((propMatches ?? []).map((p) => p.customer_id))
    );

    const clauses = [
      `name.ilike.%${q}%`,
      `email.ilike.%${q}%`,
      `phone.ilike.%${q}%`,
    ];
    if (ids.length > 0) clauses.push(`id.in.(${ids.join(",")})`);
    query = query.or(clauses.join(","));
  }

  const { data: customers, error } = await query
    .order("name", { ascending: true })
    .limit(200);

  const newButton = writable ? (
    <CustomerDialog
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> {t("newCustomer")}
        </Button>
      }
    />
  ) : null;

  return (
    <div>
      <PageHeader title={t("title")} action={newButton} />

      <div className="mb-4">
        <CustomerSearch />
      </div>

      {error ? (
        <p className="text-sm text-destructive">Could not load customers.</p>
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No matches" : t("empty")}
          description={q ? undefined : undefined}
          action={
            !q && writable ? (
              <CustomerDialog
                trigger={<Button>{t("addFirst")}</Button>}
              />
            ) : null
          }
        />
      ) : (
        <Card className="divide-y">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  {c.customer_type === "commercial" ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <Home className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant="secondary">
                  {c.customer_type === "commercial"
                    ? t("commercial")
                    : t("residential")}
                </Badge>
                <span className="hidden text-sm font-medium sm:block">
                  {formatCurrency(Number(c.lifetime_value), ctx.company.region)}
                </span>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
