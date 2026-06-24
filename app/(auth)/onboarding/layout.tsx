import { redirect } from "next/navigation";

import { getUser, getActiveContext } from "@/lib/auth/session";
import { WizardProgress } from "@/components/onboarding/WizardProgress";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Must be signed in; if already onboarded, skip the wizard entirely.
  const user = await getUser();
  if (!user) redirect("/login");
  const ctx = await getActiveContext();
  if (ctx) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10 sm:items-center sm:py-12">
      <div className="w-full max-w-2xl animate-slide-up-fade">
        <WizardProgress />
        <div className="rounded-xl border bg-card p-6 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
