import type { Metadata } from "next";
import Link from "next/link";
import { FilesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Assets",
  description: "Assets module coming soon.",
  robots: { index: false, follow: false },
};

/**
 * Placeholder route so `/assets` is a real App Router page.
 * The full Assets feature (Sprint 9.5) is not implemented yet.
 * Without this page, any Link/prefetch/history restore to `/assets` returns 404.
 */
export default function AssetsComingSoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-16">
      <EmptyState
        icon={FilesIcon}
        title="Assets coming soon"
        description="The Assets library is not available yet. You can still browse files from Spaces and Search."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={ROUTES.SPACES}>
              <Button type="button">Go to Spaces</Button>
            </Link>
            <Link href={ROUTES.SEARCH}>
              <Button type="button" variant="outline">
                Search
              </Button>
            </Link>
            <Link href={ROUTES.DASHBOARD}>
              <Button type="button" variant="ghost">
                Dashboard
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
