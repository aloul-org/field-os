import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { QuoteAcceptance } from "@/components/quote/QuoteAcceptance";
import type { EstimateStatus, LineItem, Region } from "@/lib/types/database";

interface PublicEstimatePayload {
  estimate: {
    estimate_number: string;
    job_title: string;
    summary_for_customer: string;
    line_items: LineItem[];
    subtotal: number;
    vat_rate: number;
    vat_amount: number;
    total_inc_vat: number;
    status: EstimateStatus;
    expires_at: string | null;
  };
  company: {
    business_name: string;
    logo_url: string | null;
    accent_colour: string | null;
    phone: string | null;
    email: string | null;
    region: Region;
  };
}

export const metadata: Metadata = { title: "Your quote", robots: { index: false } };

export default async function PublicQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_public_estimate", {
    p_token: params.token,
  });

  if (!data) notFound();
  const { estimate, company } = data as unknown as PublicEstimatePayload;
  const region = company.region;

  const expired =
    estimate.status === "expired" ||
    (estimate.expires_at != null &&
      new Date(estimate.expires_at).getTime() < Date.now() &&
      estimate.status === "sent");
  const decidable =
    !expired &&
    (estimate.status === "sent" ||
      estimate.status === "accepted" ||
      estimate.status === "rejected");

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
              Quote {estimate.estimate_number}
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <h2 className="text-lg font-semibold">{estimate.job_title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {estimate.summary_for_customer}
              </p>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {estimate.line_items.map((li, i) => (
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
                <span>{formatCurrency(estimate.subtotal, region)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT ({(estimate.vat_rate * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(estimate.vat_amount, region)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(estimate.total_inc_vat, region)}</span>
              </div>
            </div>

            {decidable ? (
              <QuoteAcceptance
                token={params.token}
                initialStatus={estimate.status as "sent" | "accepted" | "rejected"}
                companyName={company.business_name}
                accentColour={company.accent_colour}
              />
            ) : (
              <div className="rounded-lg border bg-muted p-4 text-center text-sm text-muted-foreground">
                This quote is no longer available. Please contact{" "}
                {company.business_name}
                {company.phone ? ` on ${company.phone}` : ""} for an updated quote.
              </div>
            )}
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
