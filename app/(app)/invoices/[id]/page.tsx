import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { DownloadPdfButton } from "@/components/shared/DownloadPdfButton";
import type { InvoiceStatus, LineItem } from "@/lib/types/database";

const STATUS_VARIANT: Record<InvoiceStatus, "secondary" | "default" | "success" | "destructive" | "warning"> = {
  draft: "secondary",
  sent: "default",
  paid: "success",
  overdue: "destructive",
  cancelled: "secondary",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("invoices");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(id, name), jobs(id, job_number)")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!invoice) notFound();

  const customer = invoice.customers as unknown as { id: string; name: string } | null;
  const job = invoice.jobs as unknown as { id: string; job_number: string } | null;
  const lineItems = (invoice.line_items ?? []) as LineItem[];
  const publicUrl = `${publicEnv.appUrl}/invoice/${invoice.public_token}`;
  const editable = writable && invoice.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {invoice.invoice_number}
            </h1>
            <Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize">
              {invoice.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer && (
              <Link href={`/customers/${customer.id}`} className="hover:text-foreground">
                {customer.name}
              </Link>
            )}
            {" · due "}
            {formatDate(invoice.due_date, region)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent>
              {editable ? (
                <InvoiceEditor
                  id={invoice.id}
                  initialItems={lineItems.map((li) => ({
                    description: li.description,
                    quantity: li.quantity,
                    unit_price: li.unit_price,
                    kind: li.kind,
                  }))}
                  vatRate={Number(invoice.vat_rate)}
                  region={region}
                />
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 text-right font-medium">Qty</th>
                        <th className="pb-2 text-right font-medium">Unit</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{li.description}</td>
                          <td className="py-2 text-right">{li.quantity}</td>
                          <td className="py-2 text-right">
                            {formatCurrency(li.unit_price, region)}
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(li.line_total, region)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(Number(invoice.subtotal), region)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        VAT ({(Number(invoice.vat_rate) * 100).toFixed(0)}%)
                      </span>
                      <span>{formatCurrency(Number(invoice.vat_amount), region)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 text-base font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(Number(invoice.total_inc_vat), region)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceActions
                id={invoice.id}
                status={invoice.status}
                publicUrl={publicUrl}
                canWrite={writable}
              />
              <div className="mt-4">
                <DownloadPdfButton
                  endpoint="/api/invoice/generate-pdf"
                  id={invoice.id}
                  existingUrl={invoice.pdf_url}
                />
              </div>
            </CardContent>
          </Card>

          {job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked job</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {job.job_number}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
