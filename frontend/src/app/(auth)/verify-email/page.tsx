import { Suspense } from "react";

import { Loader } from "@/components/ui/loader";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify email"
      subtitle="Confirm your address to finish setting up your NovaCore account."
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader label="Loading verification" />
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
