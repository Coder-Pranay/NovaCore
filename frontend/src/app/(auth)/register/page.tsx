import type { Metadata } from "next";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your NovaCore account.",
  robots: { index: true, follow: true },
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join NovaCore to organize spaces, assets, and activity in one place."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
