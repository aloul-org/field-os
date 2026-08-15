import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompanySearch } from "@/components/admin/CompanySearch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/lib/types/database";

export const metadata = { title: "Companies" };

function escapeLike(input: string): string {
  return input.replace(/[,%()]/g, " ").trim();
}

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  "success" | "secondary" | "destructive" | "warning"
> = {
  trialing: "secondary",
  active: "success",
  past_due: "warning",
  canceled: "destructive",
  incomplete: "destructive",
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const t = await getTranslations("admin");
  const supabase = createAdminClient();
  const q = escapeLike(searchParams.q ?? "");

  let query = supabase
    .from("companies")
    .select(
      "id, business_name, email, subscription_plan, subscription_status, platform_status, created_at"
    );

  if (q) {
    query = query.or(`business_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: companies, error } = await query
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title={t("companiesTitle")} description={t("companiesDescription")} />

      <div className="mb-4">
        <CompanySearch />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{t("loadError")}</p>
      ) : !companies || companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={q ? t("noMatches") : t("empty")}
        />
      ) : (
        <Card className="divide-y">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-medium">
                  {c.business_name}
                  {c.platform_status === "suspended" && (
                    <Badge variant="destructive">{t("suspended")}</Badge>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {c.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant="outline" className="capitalize">
                  {c.subscription_plan}
                </Badge>
                <Badge variant={STATUS_VARIANT[c.subscription_status]}>
                  {c.subscription_status}
                </Badge>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {formatDate(c.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
