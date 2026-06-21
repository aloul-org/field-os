import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Building2,
  Home,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Receipt,
  PhoneCall,
  Sparkles,
  Pencil,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildUpsellSuggestions } from "@/lib/crm/upsell";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { AddPropertyDialog } from "@/components/customers/AddPropertyDialog";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineEvent {
  id: string;
  type: "estimate" | "job" | "invoice" | "call";
  title: string;
  meta: string;
  date: string;
  href: string;
}

const TYPE_ICON = {
  estimate: FileText,
  job: Briefcase,
  invoice: Receipt,
  call: PhoneCall,
} as const;

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("customers");
  const supabase = createClient();
  const t = await getTranslations("customers");
  const tc = await getTranslations("common");
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!customer) notFound();

  const [properties, estimates, jobs, invoices, calls, renewals] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("estimates")
        .select("id, estimate_number, status, total_inc_vat, created_at")
        .eq("customer_id", customer.id),
      supabase
        .from("jobs")
        .select("id, job_number, title, status, created_at")
        .eq("customer_id", customer.id),
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total_inc_vat, created_at")
        .eq("customer_id", customer.id),
      supabase
        .from("calls")
        .select("id, caller_number, ai_summary, created_at")
        .eq("company_id", ctx.company.id)
        .in(
          "lead_id",
          (
            await supabase
              .from("leads")
              .select("id")
              .eq("customer_id", customer.id)
          ).data?.map((l) => l.id) ?? ["00000000-0000-0000-0000-000000000000"]
        ),
      supabase
        .from("renewal_plans")
        .select("id, status")
        .eq("customer_id", customer.id)
        .eq("status", "active"),
    ]);

  // Merge timeline in the app layer (per spec — no SQL union view in v1).
  const events: TimelineEvent[] = [
    ...(estimates.data ?? []).map((e) => ({
      id: e.id,
      type: "estimate" as const,
      title: `Estimate ${e.estimate_number}`,
      meta: `${e.status} · ${formatCurrency(Number(e.total_inc_vat), region)}`,
      date: e.created_at,
      href: `/estimates/${e.id}`,
    })),
    ...(jobs.data ?? []).map((j) => ({
      id: j.id,
      type: "job" as const,
      title: `Job ${j.job_number}: ${j.title}`,
      meta: j.status,
      date: j.created_at,
      href: `/jobs/${j.id}`,
    })),
    ...(invoices.data ?? []).map((i) => ({
      id: i.id,
      type: "invoice" as const,
      title: `Invoice ${i.invoice_number}`,
      meta: `${i.status} · ${formatCurrency(Number(i.total_inc_vat), region)}`,
      date: i.created_at,
      href: `/invoices/${i.id}`,
    })),
    ...(calls.data ?? []).map((c) => ({
      id: c.id,
      type: "call" as const,
      title: `Call from ${c.caller_number}`,
      meta: c.ai_summary ?? "Inbound call",
      date: c.created_at,
      href: `/calls/${c.id}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedJobs = (jobs.data ?? []).filter(
    (j) => j.status === "completed" || j.status === "invoiced"
  );
  const lastCompleted = completedJobs
    .map((j) => j.created_at)
    .sort()
    .at(-1);

  const upsells = buildUpsellSuggestions({
    trade: ctx.company.trade,
    hasActiveRenewalPlan: (renewals.data ?? []).length > 0,
    lastCompletedJobAt: lastCompleted ?? null,
    jobCount: (jobs.data ?? []).length,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
            {customer.customer_type === "commercial" ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <Home className="h-5 w-5" />
            )}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {customer.customer_type === "commercial"
                  ? t("commercial")
                  : t("residential")}
              </Badge>
              <span>·</span>
              <span>
                {t("lifetimeValue")}:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(Number(customer.lifetime_value), region)}
                </span>
              </span>
            </div>
          </div>
        </div>
        {writable && (
          <div className="flex items-center gap-1">
            <CustomerDialog
              customer={customer}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> {tc("edit")}
                </Button>
              }
            />
            <DeleteCustomerButton id={customer.id} name={customer.name} />
          </div>
        )}
      </div>

      {/* Contact + AI summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("aiSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {customer.ai_summary ??
                "A summary is generated automatically after this customer's next job or invoice."}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
              {customer.phone && (
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.email}
                </span>
              )}
            </div>
            {customer.notes && (
              <p className="rounded-md bg-muted p-3 text-muted-foreground">
                {customer.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upsell suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> {t("upsell")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upsells.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No suggestions right now.
              </p>
            ) : (
              upsells.map((u) => (
                <div key={u.title} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{u.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("properties")}</CardTitle>
          {writable && <AddPropertyDialog customerId={customer.id} />}
        </CardHeader>
        <CardContent>
          {!properties.data || properties.data.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("noProperties")}
            </p>
          ) : (
            <ul className="space-y-3">
              {properties.data.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-muted-foreground">
                      {[p.address_line1, p.city, p.postcode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {p.access_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Access: {p.access_notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("noHistory")}
            </p>
          ) : (
            <ul className="space-y-1">
              {events.map((e) => {
                const Icon = TYPE_ICON[e.type];
                return (
                  <li key={`${e.type}-${e.id}`}>
                    <Link
                      href={e.href}
                      className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                          {e.meta}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(e.date, region)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
