"use client";

import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { ROUTES } from "@/constants";
import { WidgetShell } from "@/features/dashboard/components/widget-shell";
import { useDashboard } from "@/features/dashboard/hooks";
import { getErrorMessage } from "@/utils";

export function FavoritesSummaryWidget() {
  const query = useDashboard();
  const favoriteSpaces = query.data?.spaces.favoriteSpaces ?? 0;

  return (
    <WidgetShell
      title="Favorites"
      description="Quick access to starred spaces"
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && favoriteSpaces === 0}
      emptyTitle="No favorites"
      emptyDescription="Star a space to pin it here for faster access."
      errorMessage={getErrorMessage(query.error)}
      onRetry={() => void query.refetch()}
      action={
        <Link
          href={ROUTES.FAVORITES}
          className="border-border hover:bg-muted inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium"
        >
          Manage
        </Link>
      }
    >
      <div className="flex items-center gap-3">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
          <HeartIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-2xl font-semibold">{favoriteSpaces}</p>
          <p className="text-muted-foreground text-sm">Favorite spaces</p>
        </div>
      </div>
    </WidgetShell>
  );
}
