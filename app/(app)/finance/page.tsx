import Link from "next/link";
import { TrendingUp, Bot } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Finance" };

type Tab = "job" | "technician" | "service" | "customer";
const TABS: { key: Tab; label: string }[] = [
  { key: "job", label: "By job" },
  { key: "technician", label: "By technician" },
  { key: "service", label: "By service" },
  { key: "customer", label: "By customer" },
];

interface Row {
  job_id: string;
  revenue: number;
  profit: number;
  technician_id: string | null;
  job: { title: string; trade_category: string; customer_id: string | null } | null;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const ctx = await requireSection("finance");
  const supabase = createClient();
  const region = ctx.company.region;
  const tab: Tab = TABS.some((t) => t.key === searchParams.tab)
    ? (searchParams.tab as Tab)
    : "job";

  const { data: rawRows } = await supabase
    .from("job_profitability")
    .select("job_id, revenue, profit, technician_id, jobs(title, trade_category, customer_id)")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: Row[] = (rawRows ?? []).map((r) => ({
    job_id: r.job_id,
    revenue: Number(r.revenue),
    profit: Number(r.profit ?? 0),
    technician_id: r.technician_id,
    job: r.jobs as unknown as Row["job"],
  }));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Resolve labels for technician/customer groupings.
  const [{ data: members }, { data: customers }] = await Promise.all([
    supabase.from("team_members").select("id, name").eq("company_id", ctx.company.id),
    supabase.from("customers").select("id, name").eq("company_id", ctx.company.id),
  ]);
  const techName = new Map((members ?? []).map((m) => [m.id, m.name]));
  const custName = new Map((customers ?? []).map((c) => [c.id, c.name]));

  // Group rows for the active tab.
  const groups = new Map<string, { label: string; revenue: number; profit: number; href?: string }>();
  for (const r of rows) {
    let key: string;
    let label: string;
    let href: string | undefined;
    if (tab === "job") {
      key = r.job_id;
      label = r.job?.title ?? "Job";
      href = `/jobs/${r.job_id}`;
    } else if (tab === "technician") {
      key = r.technician_id ?? "none";
      label = r.technician_id ? techName.get(r.technician_id) ?? "Technician" : "Unassigned";
    } else if (tab === "service") {
      key = r.job?.trade_category ?? "other";
      label = r.job?.trade_category ?? "Other";
    } else {
      key = r.job?.customer_id ?? "none";
      label = r.job?.customer_id ? custName.get(r.job.customer_id) ?? "Customer" : "—";
    }
    const g = groups.get(key) ?? { label, revenue: 0, profit: 0, href };
    g.revenue += r.revenue;
    g.profit += r.profit;
    groups.set(key, g);
  }
  const grouped = Array.from(groups.values()).sort((a, b) => b.profit - a.profit);
  const maxProfit = Math.max(1, ...grouped.map((g) => Math.abs(g.profit)));

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Profit by job, technician, service and customer — from paid invoices."
        action={
          <Button asChild variant="outline">
            <Link href="/finance/ai-cfo">
              <Bot className="h-4 w-4" /> Ask the AI CFO
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No profit data yet"
          description="Once you mark an invoice paid, FieldOS works out the job's profit and it'll show up here."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Revenue (paid)" value={formatCurrency(totalRevenue, region)} />
            <StatCard label="Profit" value={formatCurrency(totalProfit, region)} tone="success" />
            <StatCard label="Avg margin" value={`${avgMargin.toFixed(0)}%`} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/finance?tab=${t.key}`}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Profitability {TABS.find((t) => t.key === tab)?.label.toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grouped.map((g, i) => {
                const margin = g.revenue > 0 ? (g.profit / g.revenue) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">
                        {g.href ? (
                          <Link href={g.href} className="hover:underline">
                            {g.label}
                          </Link>
                        ) : (
                          g.label
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatCurrency(g.profit, region)}{" "}
                        <span className="text-muted-foreground">({margin.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-pill",
                          g.profit >= 0 ? "bg-success" : "bg-destructive"
                        )}
                        style={{ width: `${Math.round((Math.abs(g.profit) / maxProfit) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Overhead is allocated evenly across jobs this month — for exact figures, consult your
            accountant.
          </p>
        </>
      )}
    </div>
  );
}
