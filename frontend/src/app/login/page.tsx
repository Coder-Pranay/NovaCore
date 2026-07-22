import { UnauthorizedView } from "@/components/global/unauthorized-view";

export default function LoginPlaceholderPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <UnauthorizedView description="Sign-in UI will be implemented in Sprint 9.2." />
    </main>
  );
}
