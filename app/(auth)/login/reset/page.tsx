import { ResetForm } from "@/components/auth/ResetForm";

export const metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <div className="w-full max-w-md">
      <ResetForm />
    </div>
  );
}
