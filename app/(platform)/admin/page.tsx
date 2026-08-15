import { getTranslations } from "next-intl/server";
import { TrendingUp, CheckCircle2, Sparkles, Building2 } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/server";
import { getPlatformReports } from "@/lib/admin/reports";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { MiniBars } from "@/components/charts/MiniBars";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Platform reports" };

export default async function AdminReportsPage() {
  const t = await getTranslations("admin");
  const reports = await getPlatformReports(createAdminClient());

  const signupsTotal = reports.signupsTrend.reduce((s, m) => s + m.value, 0);
  const planTotal = reports.planBreakdown.reduce((s, x) => s + x.value, 0);
  const statusTotal = reports.statusBreakdown.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <StatCard
          size="hero"
          className="animate-fade-rise sm:col-span-2 lg:col-span-2 lg:row-span-2"
          label={t("mrr")}
          value={
            <span className="flex flex-wrap items-baseline gap-x-3">
              <AnimatedNumber value={reports.mrrGBP} kind="currency" region="UK" />
              <span className="text-lg font-normal text-muted-foreground">
                <AnimatedNumber value={reports.mrrEUR} kind="currency" region="DE" />
              </span>
            </span>
          }
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          className="animate-fade-rise [animation-delay:80ms]"
          label={t("activeSubscriptions")}
          value={<AnimatedNumber value={reports.activeCount} />}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          className="animate-fade-rise [animation-delay:160ms]"
          label={t("trialingCompanies")}
          value={<AnimatedNumber value={reports.trialingCount} />}
          icon={Sparkles}
        />
        <StatCard
          className="animate-fade-rise [animation-delay:240ms] sm:col-span-2 lg:col-span-2"
          label={t("totalCompanies")}
          value={<AnimatedNumber value={reports.totalCount} />}
          icon={Building2}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="animate-fade-rise lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("signupsTrendTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {signupsTotal > 0 ? (
              <AreaChart data={reports.signupsTrend} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("signupsTrendEmpty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-rise [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="text-base">{t("conversionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {reports.trialsEndedCount > 0 ? (
              <RadialGauge
                value={reports.conversionRate}
                label={t("conversionLabel", {
                  converted: Math.round(
                    (reports.conversionRate / 100) * reports.trialsEndedCount
                  ),
                  ended: reports.trialsEndedCount,
                })}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("conversionEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="animate-fade-rise">
          <CardHeader>
            <CardTitle className="text-base">{t("planBreakdownTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {planTotal > 0 ? (
              <DonutChart
                segments={reports.planBreakdown}
                centerValue={String(planTotal)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("planBreakdownEmpty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-rise [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="text-base">{t("statusBreakdownTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusTotal > 0 ? (
              <MiniBars rows={reports.statusBreakdown} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("statusBreakdownEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
