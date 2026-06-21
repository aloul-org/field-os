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
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/components/shared/StatCard";
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
      label: `Hot lead: ${l.contact_name ?? "New enquiry"}`,
      href: `/leads/${l.id}`,
    })),
    ...(emergencyJobs.data ?? []).map((j) => ({
      key: `job-${j.id}`,
      icon: Siren,
      tone: "destructive" as const,
      label: `Emergency job unscheduled: ${j.title}`,
      href: `/jobs/${j.id}`,
    })),
    ...(overdueInvoices.data ?? []).map((i) => ({
      key: `inv-${i.id}`,
      icon: AlertTriangle,
      tone: "warning" as const,
      label: `Overdue invoice ${i.invoice_number} — ${formatCurrency(Number(i.total_inc_vat), region)}`,
      href: `/invoices/${i.id}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(greetingKey())}, {ctx.member.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ctx.company.business_name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("jobsToday")} value={jobsToday.count ?? 0} icon={Briefcase} />
        <StatCard
          label={t("estimatesPending")}
          value={estimatesPending.count ?? 0}
          icon={FileText}
        />
        <StatCard
          label={t("outstandingInvoices")}
          value={formatCurrency(outstandingTotal, region)}
          icon={Receipt}
          tone={outstandingTotal > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("revenueThisMonth")}
          value={formatCurrency(revenueTotal, region)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("needsAttention")}</CardTitle>
          {attention.length > 0 && (
            <Badge variant="secondary">{attention.length}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("noAttentionItems")}
            </p>
          ) : (
            <ul className="divide-y">
              {attention.map(({ key, icon: Icon, tone, label, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 py-3 text-sm hover:text-primary"
                  >
                    <Icon
                      className={
                        tone === "destructive"
                          ? "h-4 w-4 text-destructive"
                          : "h-4 w-4 text-warning"
                      }
                    />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
