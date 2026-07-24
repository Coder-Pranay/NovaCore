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

export default function PrivateErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Private route error:", error);
  }, [error]);

  return (
    <EmptyState
      title="Unable to load this page"
      description={
        error.message ||
        "Something went wrong while loading this section. Retry or go back to the dashboard."
      }
      icon={AlertTriangleIcon}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            Retry
          </Button>
          <Link href={ROUTES.DASHBOARD}>
            <Button type="button" variant="outline">
              Dashboard
            </Button>
          </Link>
        </div>
      }
    />
  );
}
