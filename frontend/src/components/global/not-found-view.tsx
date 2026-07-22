import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

export function NotFoundView() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist or may have moved."
      icon={FileQuestionIcon}
      action={
        <Link href={ROUTES.HOME}>
          <Button type="button">Return home</Button>
        </Link>
      }
    />
  );
}
