import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Briefcase,
  FileText,
  Receipt,
  TrendingUp,
  Flame,
  AlertTriangle,
  Siren,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { RouteLine } from "@/components/shared/RouteLine";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard" };

function greetingKey(): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "greetingMorning";
  if (h < 18) return "greetingAfternoon";
  return "greetingEvening";
}

export default async function DashboardPage() {
  const ctx = await requireSection("dashboard");
  const supabase = createClient();
  const t = await getTranslations("dashboard");
  const region = ctx.company.region;
  const companyId = ctx.company.id;

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Stats — independent queries run in parallel.
  const [
    jobsToday,
    estimatesPending,
    outstanding,
    revenue,
    hotLeads,
    overdueInvoices,
    emergencyJobs,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("scheduled_start", dayStart.toISOString())
      .lt("scheduled_start", dayEnd.toISOString()),
    supabase
      .from("estimates")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("total_inc_vat")
      .eq("company_id", companyId)
      .in("status", ["sent", "overdue"]),
    supabase
      .from("invoices")
      .select("total_inc_vat")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("leads")
      .select("id, contact_name, job_description, created_at")
      .eq("company_id", companyId)
      .eq("score", "hot")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("id, invoice_number, total_inc_vat")
      .eq("company_id", companyId)
      .eq("status", "overdue")
      .limit(5),
    supabase
      .from("jobs")
      .select("id, title, job_number")
      .eq("company_id", companyId)
      .eq("priority", "emergency")
      .eq("status", "unscheduled")
      .limit(5),
  ]);

  const outstandingTotal = (outstanding.data ?? []).reduce(
    (sum, i) => sum + Number(i.total_inc_vat),
    0
  );
  const revenueTotal = (revenue.data ?? []).reduce(
    (sum, i) => sum + Number(i.total_inc_vat),
    0
  );

  const attention = [
    ...(hotLeads.data ?? []).map((l) => ({
      key: `lead-${l.id}`,
      icon: Flame,
      tone: "destructive" as const,
      label: "Hot lead",
      code: null as string | null,
      detail: l.contact_name ?? "New enquiry",
      href: `/leads/${l.id}`,
    })),
    ...(emergencyJobs.data ?? []).map((j) => ({
      key: `job-${j.id}`,
      icon: Siren,
      tone: "destructive" as const,
      label: "Emergency — unscheduled",
      code: j.job_number as string | null,
      detail: j.title,
      href: `/jobs/${j.id}`,
    })),
    ...(overdueInvoices.data ?? []).map((i) => ({
      key: `inv-${i.id}`,
      icon: AlertTriangle,
      tone: "warning" as const,
      label: "Overdue invoice",
      code: i.invoice_number as string | null,
      detail: formatCurrency(Number(i.total_inc_vat), region),
      href: `/invoices/${i.id}`,
    })),
  ];

  const today = now.toLocaleDateString(region === "DE" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t(greetingKey())}, {ctx.member.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ctx.company.business_name}
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">{today}</p>
        </div>
        <RouteLine className="mt-4 max-w-md" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <StatCard
          size="hero"
          className="animate-fade-rise sm:col-span-2 lg:col-span-2 lg:row-span-2"
          label={t("revenueThisMonth")}
          value={<AnimatedNumber value={revenueTotal} kind="currency" region={region} />}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          className="animate-fade-rise [animation-delay:80ms]"
          label={t("jobsToday")}
          value={<AnimatedNumber value={jobsToday.count ?? 0} region={region} />}
          icon={Briefcase}
        />
        <StatCard
          className="animate-fade-rise [animation-delay:160ms]"
          label={t("estimatesPending")}
          value={<AnimatedNumber value={estimatesPending.count ?? 0} region={region} />}
          icon={FileText}
        />
        <StatCard
          className="animate-fade-rise [animation-delay:240ms] sm:col-span-2 lg:col-span-2"
          label={t("outstandingInvoices")}
          value={<AnimatedNumber value={outstandingTotal} kind="currency" region={region} />}
          icon={Receipt}
          tone={outstandingTotal > 0 ? "warning" : "default"}
        />
      </div>

      <Card className="job-ticket">
        <CardHeader className="flex-row items-center justify-between space-y-0 pt-7">
          <CardTitle className="text-base">{t("needsAttention")}</CardTitle>
          {attention.length > 0 && (
            <Badge variant="secondary">{attention.length}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {attention.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title={t("noAttentionItems")}
              className="border-none bg-transparent py-8"
            />
          ) : (
            <ul className="divide-y">
              {attention.map(({ key, icon: Icon, tone, label, code, detail, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 rounded-md py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                        tone === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">
                        {label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {code && (
                          <span className="font-mono">{code}</span>
                        )}
                        {code && " · "}
                        {detail}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
