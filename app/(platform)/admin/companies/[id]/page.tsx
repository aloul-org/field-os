import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyAdminActions } from "@/components/admin/CompanyAdminActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Company detail" };

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getTranslations("admin");
  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!company) notFound();

  const [{ data: members }, { count: jobCount }, { count: estimateCount }, { data: profitability }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("id, name, email, role, is_active")
        .eq("company_id", company.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id),
      supabase
        .from("estimates")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id),
      supabase
        .from("job_profitability")
        .select("revenue, profit")
        .eq("company_id", company.id),
    ]);

  const totalRevenue = (profitability ?? []).reduce(
    (sum, row) => sum + Number(row.revenue ?? 0),
    0
  );
  const totalProfit = (profitability ?? []).reduce(
    (sum, row) => sum + Number(row.profit ?? 0),
    0
  );

  return (
    <div>
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToCompanies")}
      </Link>

      <PageHeader
        title={company.business_name}
        description={company.email}
        action={
          <CompanyAdminActions
            companyId={company.id}
            isSuspended={company.platform_status === "suspended"}
          />
        }
      />

      {company.platform_status === "suspended" && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-destructive">{t("suspendedSince")} {formatDate(company.suspended_at!)}</p>
            {company.suspended_reason && (
              <p className="mt-1 text-muted-foreground">{company.suspended_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("jobs")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{jobCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("estimates")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{estimateCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("revenue")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">
            {formatCurrency(totalRevenue, company.region)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {t("profit")}: {formatCurrency(totalProfit, company.region)}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("billing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("plan")}</span>
              <span className="capitalize">{company.subscription_plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("status")}</span>
              <Badge variant="outline" className="capitalize">
                {company.subscription_status}
              </Badge>
            </div>
            {company.trial_ends_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("trialEnds")}</span>
                <span>{formatDate(company.trial_ends_at, company.region)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("created")}</span>
              <span>{formatDate(company.created_at, company.region)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("team")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {(members ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!m.is_active && <Badge variant="destructive">{t("inactive")}</Badge>}
                  <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
