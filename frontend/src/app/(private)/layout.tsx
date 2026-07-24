import { RequireAuth } from "@/features/auth/components/require-auth";
import { AppShell } from "@/features/dashboard/layouts/app-shell";

export default function PrivateGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
