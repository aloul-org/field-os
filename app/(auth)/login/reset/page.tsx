import { ResetForm } from "@/components/auth/ResetForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <AuthShell>
      <ResetForm />
    </AuthShell>
  );
}
