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
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { MiniBars } from "@/components/charts/MiniBars";
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

  // Revenue trend window — first day, six months back.
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const loc = region === "DE" ? "de-DE" : "en-GB";

  // Stats — independent queries run in parallel.
  const [
    jobsToday,
    estimatesPending,
    outstanding,
    revenue,
    hotLeads,
    overdueInvoices,
    emergencyJobs,
    paidTrend,
    jobRows,
    estRows,
    leadRows,
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
    supabase
      .from("invoices")
      .select("total_inc_vat, paid_at")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("paid_at", trendStart.toISOString()),
    supabase
      .from("jobs")
      .select("status")
      .eq("company_id", companyId)
      .limit(1000),
    supabase
      .from("estimates")
      .select("status")
      .eq("company_id", companyId)
      .limit(1000),
    supabase
      .from("leads")
      .select("score")
      .eq("company_id", companyId)
      .neq("status", "spam")
      .limit(1000),
  ]);

  const outstandingTotal = (outstanding.data ?? []).reduce(
    (sum, i) => sum + Number(i.total_inc_vat),
    0
  );
  const revenueTotal = (revenue.data ?? []).reduce(
    (sum, i) => sum + Number(i.total_inc_vat),
    0
  );

  // --- Analytics ---------------------------------------------------------
  // Revenue trend: bucket paid invoices into the last six calendar months.
  const trend = [0, 1, 2, 3, 4, 5].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(loc, { month: "short" }),
      value: 0,
    };
  });
  for (const inv of paidTrend.data ?? []) {
    if (!inv.paid_at) continue;
    const d = new Date(inv.paid_at);
    const bucket = trend.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.value += Number(inv.total_inc_vat);
  }
  const trendTotal = trend.reduce((s, m) => s + m.value, 0);

  // Jobs by status (donut).
  const JOB_COLORS: Record<string, string> = {
    completed: "hsl(var(--success))",
    invoiced: "hsl(var(--success))",
    in_progress: "hsl(var(--primary))",
    en_route: "hsl(var(--primary))",
    scheduled: "hsl(var(--warning))",
    unscheduled: "hsl(var(--destructive))",
    cancelled: "hsl(var(--muted-foreground))",
  };
  const jobCounts = new Map<string, number>();
  for (const j of jobRows.data ?? []) {
    jobCounts.set(j.status, (jobCounts.get(j.status) ?? 0) + 1);
  }
  const jobSegments = Array.from(jobCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([status, value]) => ({
      label: status.replace(/_/g, " ").replace(/^\w/, (c: string) => c.toUpperCase()),
      value,
      color: JOB_COLORS[status] ?? "hsl(var(--muted-foreground))",
    }));
  const jobTotal = jobSegments.reduce((s, x) => s + x.value, 0);

  // Estimate win rate (gauge).
  const estCounts = new Map<string, number>();
  for (const e of estRows.data ?? []) {
    estCounts.set(e.status, (estCounts.get(e.status) ?? 0) + 1);
  }
  const accepted = estCounts.get("accepted") ?? 0;
  const rejected = estCounts.get("rejected") ?? 0;
  const decided = accepted + rejected;
  const winRate = decided > 0 ? (accepted / decided) * 100 : 0;

  // Leads by score (pipeline bars).
  const scoreCounts: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
  for (const l of leadRows.data ?? []) {
    if (l.score && l.score in scoreCounts) scoreCounts[l.score] += 1;
  }
  const leadRowsView = [
    { label: t("leadScoreHot"), value: scoreCounts.hot, color: "hsl(var(--destructive))" },
    { label: t("leadScoreWarm"), value: scoreCounts.warm, color: "hsl(var(--warning))" },
    { label: t("leadScoreCold"), value: scoreCounts.cold, color: "hsl(var(--muted-foreground))" },
  ];
  const leadTotal = scoreCounts.hot + scoreCounts.warm + scoreCounts.cold;

  const attention = [
    ...(hotLeads.data ?? []).map((l) => ({
      key: `lead-${l.id}`,
      icon: Flame,
      tone: "destructive" as const,
      label: t("attentionHotLead"),
      code: null as string | null,
      detail: l.contact_name ?? t("attentionNewEnquiry"),
      href: `/leads/${l.id}`,
    })),
    ...(emergencyJobs.data ?? []).map((j) => ({
      key: `job-${j.id}`,
      icon: Siren,
      tone: "destructive" as const,
      label: t("attentionEmergencyUnscheduled"),
      code: j.job_number as string | null,
      detail: j.title,
      href: `/jobs/${j.id}`,
    })),
    ...(overdueInvoices.data ?? []).map((i) => ({
      key: `inv-${i.id}`,
      icon: AlertTriangle,
      tone: "warning" as const,
      label: t("attentionOverdueInvoice"),
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

      {/* Analytics row 1 — revenue trend + win rate */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="animate-fade-rise lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("revenueTrendTitle")}</CardTitle>
            <span className="font-display text-sm font-bold text-success">
              {formatCurrency(trendTotal, region)}
            </span>
          </CardHeader>
          <CardContent>
            {trendTotal > 0 ? (
              <AreaChart data={trend} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("revenueTrendEmpty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-rise [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="text-base">{t("winRateTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {decided > 0 ? (
              <RadialGauge
                value={winRate}
                label={t("winRateLabel", { accepted, decided })}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("winRateEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics row 2 — jobs breakdown + lead pipeline */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="animate-fade-rise">
          <CardHeader>
            <CardTitle className="text-base">{t("jobsByStatusTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {jobTotal > 0 ? (
              <DonutChart
                segments={jobSegments}
                centerValue={String(jobTotal)}
                centerLabel={t("jobsCenterLabel")}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("jobsByStatusEmpty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-rise [animation-delay:80ms]">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("leadPipelineTitle")}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {t("leadPipelineTotal", { count: leadTotal })}
            </span>
          </CardHeader>
          <CardContent>
            {leadTotal > 0 ? (
              <MiniBars rows={leadRowsView} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("leadPipelineEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
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
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm",
                        tone === "destructive"
                          ? "bg-gradient-to-br from-destructive/25 via-destructive/10 to-transparent text-destructive ring-1 ring-inset ring-destructive/15"
                          : "bg-gradient-to-br from-warning/25 via-warning/10 to-transparent text-warning ring-1 ring-inset ring-warning/15"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2.25} />
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
