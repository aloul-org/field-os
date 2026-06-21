import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "No access" };

export default async function NoAccessPage() {
  const t = await getTranslations("errors");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-semibold">{t("noAccess")}</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {t("noAccessBody")}
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
