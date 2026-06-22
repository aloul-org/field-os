import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { WidgetSettings } from "@/components/settings/WidgetSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Lead capture" };

export default async function LeadCaptureSettingsPage() {
  const ctx = await requireSection("settings");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Lead capture</h2>
        <p className="text-sm text-muted-foreground">
          Capture enquiries from your website. Every submission lands in your Leads inbox, scored automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Website widget</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetSettings
            widgetKey={ctx.company.widget_public_key}
            enabled={ctx.company.widget_enabled}
            appUrl={publicEnv.appUrl}
            canWrite={canWrite(ctx.role)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
