import Link from "next/link";
import { Receipt } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { InvoiceStatus } from "@/lib/types/database";

export const metadata = { title: "Invoices" };

const STATUS_VARIANT: Record<InvoiceStatus, "secondary" | "default" | "success" | "destructive" | "warning"> = {
  draft: "secondary",
  sent: "default",
  paid: "success",
  overdue: "destructive",
  cancelled: "secondary",
};

export default async function InvoicesPage() {
  const ctx = await requireSection("invoices");
  const supabase = createClient();
  const region = ctx.company.region;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total_inc_vat, due_date, created_at, customers(name)")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="Invoices" />

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices are created from completed jobs or accepted estimates."
        />
      ) : (
        <Card className="divide-y">
          {invoices.map((inv) => {
            const customer = inv.customers as unknown as { name: string } | null;
            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.invoice_number}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {customer?.name ?? "—"} · due {formatDate(inv.due_date, region)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden font-medium sm:block">
                    {formatCurrency(Number(inv.total_inc_vat), region)}
                  </span>
                  <Badge variant={STATUS_VARIANT[inv.status]} className="capitalize">
                    {inv.status}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
