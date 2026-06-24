import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Log in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  return (
    <AuthShell>
      <LoginForm redirectTo={searchParams.redirectTo} />
    </AuthShell>
  );
}
