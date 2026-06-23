import { Package, Plus, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StockBar } from "@/components/materials/StockBar";
import { MaterialDialog } from "@/components/materials/MaterialDialog";
import { RestockButton } from "@/components/materials/RestockButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Materials" };

export default async function MaterialsPage() {
  const ctx = await requireSection("materials");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);
  const t = await getTranslations("materials");

  const [{ data: materials }, { data: suppliers }] = await Promise.all([
    supabase
      .from("materials")
      .select("*")
      .eq("company_id", ctx.company.id)
      .order("name"),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("company_id", ctx.company.id)
      .order("name"),
  ]);

  const supplierList = suppliers ?? [];
  const list = materials ?? [];
  const lowStock = list.filter((m) => m.quantity_on_hand <= m.reorder_threshold);

  const addButton = writable ? (
    <MaterialDialog
      suppliers={supplierList}
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> {t("addMaterial")}
        </Button>
      }
    />
  ) : null;

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={addButton}
      />

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>{t("lowStock", { count: lowStock.length })}</span>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={addButton}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[m.sku, m.category].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  {m.unit_cost != null && (
                    <Badge variant="secondary">
                      {formatCurrency(Number(m.unit_cost), region)}
                      {m.unit ? `/${m.unit}` : ""}
                    </Badge>
                  )}
                </div>
                <StockBar onHand={m.quantity_on_hand} threshold={m.reorder_threshold} />
                {writable && (
                  <div className="flex gap-2">
                    <RestockButton
                      materialId={m.id}
                      materialName={m.name}
                      suggestedQty={Math.max(m.reorder_threshold * 2 - m.quantity_on_hand, 1)}
                    />
                    <MaterialDialog
                      suppliers={supplierList}
                      material={m}
                      trigger={
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
