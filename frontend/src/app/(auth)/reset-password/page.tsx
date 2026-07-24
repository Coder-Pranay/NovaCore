import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a strong password for your NovaCore account."
    >
      {!token ? (
        <p className="text-destructive text-sm" role="alert">
          Reset token is missing or invalid. Request a new password reset link.
        </p>
      ) : null}
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
