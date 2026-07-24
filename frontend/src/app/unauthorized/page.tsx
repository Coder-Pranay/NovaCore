import { UnauthorizedView } from "@/components/global/unauthorized-view";

export default function UnauthorizedPage() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center p-6">
      <UnauthorizedView description="You do not have permission to access this resource." />
    </main>
  );
}
