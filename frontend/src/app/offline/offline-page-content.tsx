"use client";

import Link from "next/link";
import { WifiOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

export function OfflinePageContent() {
  return (
    <EmptyState
      title="You are offline"
      description="NovaCore cannot reach the network right now. Cached pages may still work; reconnect to continue."
      icon={WifiOffIcon}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Link href={ROUTES.HOME}>
            <Button type="button" variant="outline">
              Go home
            </Button>
          </Link>
        </div>
      }
    />
  );
}
