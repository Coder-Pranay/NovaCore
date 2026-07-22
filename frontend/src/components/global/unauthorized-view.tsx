import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

interface UnauthorizedViewProps {
  description?: string;
}

export function UnauthorizedView({
  description = "You need to sign in to access this page.",
}: UnauthorizedViewProps) {
  return (
    <EmptyState
      title="Authentication required"
      description={description}
      icon={ShieldAlertIcon}
      action={
        <Link href={ROUTES.LOGIN}>
          <Button type="button">Go to sign in</Button>
        </Link>
      }
    />
  );
}
