import { getTranslations } from "next-intl/server";

import { requireSection } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSection("settings");
  const t = await getTranslations("settings");

  return (
    <div>
      <PageHeader title={t("title")} />
      <SettingsNav />
      {children}
    </div>
  );
}
