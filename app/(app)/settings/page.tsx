import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireSection("settings");
  return (
    <CompanySettingsForm company={ctx.company} readOnly={!canWrite(ctx.role)} />
  );
}
