import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Shared link",
  description: "Public share links are not available yet.",
  robots: { index: false, follow: false },
};

/**
 * Public share landing placeholder.
 * Sharing currently stores tokens in localStorage only; no backend public-link API.
 */
export default async function SharedLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main
      id="main-content"
      className="flex min-h-full flex-1 items-center justify-center p-6"
    >
      <EmptyState
        icon={LinkIcon}
        title="Public share links coming soon"
        description={`This link token (${token.slice(0, 8)}…) cannot be opened yet. Sharing is local-only until a public-link API ships.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={ROUTES.LOGIN}>
              <Button type="button">Sign in</Button>
            </Link>
            <Link href={ROUTES.HOME}>
              <Button type="button" variant="outline">
                Home
              </Button>
            </Link>
          </div>
        }
      />
    </main>
  );
}
