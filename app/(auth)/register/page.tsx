import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Start free trial" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <RegisterForm />
    </div>
  );
}
