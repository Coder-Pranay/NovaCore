"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-full flex-1 items-center justify-center p-6"
    >
      <EmptyState
        title="Something went wrong"
        description={
          error.message ||
          "An unexpected error occurred. You can try again or return to the dashboard."
        }
        icon={AlertTriangleIcon}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Link href={ROUTES.DASHBOARD}>
              <Button type="button" variant="outline">
                Dashboard
              </Button>
            </Link>
          </div>
        }
      />
    </main>
  );
}
