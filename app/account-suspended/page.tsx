import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Account suspended" };

export default async function AccountSuspendedPage() {
  const t = await getTranslations("admin");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-semibold">{t("accountSuspendedTitle")}</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {t("accountSuspendedBody")}
      </p>
    </div>
  );
}
