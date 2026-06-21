import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { PublicInvoicePay } from "@/components/invoices/PublicInvoicePay";
import type { InvoiceStatus, LineItem, Region } from "@/lib/types/database";

interface PublicInvoicePayload {
  invoice: {
    invoice_number: string;
    line_items: LineItem[];
    subtotal: number;
    vat_rate: number;
    vat_amount: number;
    total_inc_vat: number;
    status: InvoiceStatus;
    due_date: string;
  };
  company: {
    business_name: string;
    logo_url: string | null;
    accent_colour: string | null;
    phone: string | null;
    email: string | null;
    region: Region;
  };
  customer_name: string | null;
}

export const metadata: Metadata = { title: "Your invoice", robots: { index: false } };

export default async function PublicInvoicePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_public_invoice", {
    p_token: params.token,
  });
  if (!data) notFound();

  const { invoice, company } = data as unknown as PublicInvoicePayload;
  const region = company.region;

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto max-w-xl px-4">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6 text-center">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt={company.business_name}
                className="mx-auto h-12 object-contain"
              />
            ) : (
              <h1 className="text-xl font-semibold">{company.business_name}</h1>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Invoice {invoice.invoice_number} · due {formatDate(invoice.due_date, region)}
            </p>
          </div>

          <div className="space-y-6 p-6">
            <table className="w-full text-sm">
              <tbody>
                {invoice.line_items.map((li, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5">
                      {li.description}
                      {li.quantity !== 1 && (
                        <span className="text-muted-foreground"> × {li.quantity}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {formatCurrency(li.line_total, region)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, region)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT ({(invoice.vat_rate * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(invoice.vat_amount, region)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                <span>Total due</span>
                <span>{formatCurrency(invoice.total_inc_vat, region)}</span>
              </div>
            </div>

            <PublicInvoicePay
              token={params.token}
              status={invoice.status}
              accentColour={company.accent_colour}
            />
          </div>

          <div className="border-t bg-muted/40 p-4 text-center text-xs text-muted-foreground">
            {company.business_name}
            {company.phone ? ` · ${company.phone}` : ""}
            {company.email ? ` · ${company.email}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
