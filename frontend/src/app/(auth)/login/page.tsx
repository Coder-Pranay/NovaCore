import { Suspense } from "react";

import { PageLoader } from "@/components/global/page-loader";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your NovaCore account to continue."
    >
      <Suspense fallback={<PageLoader label="Loading sign in" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
