"use client";

import Link from "next/link";
import { PinIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export function PinnedItemsWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Pinned items</CardTitle>
        <CardDescription>Keep critical spaces and assets nearby</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          className="py-6"
          title="No pinned items"
          description="Pinning will be available with Favorites ordering in a later sprint."
          icon={PinIcon}
          action={
            <Link
              href={ROUTES.FAVORITES}
              className="border-border hover:bg-muted inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium"
            >
              Go to Favorites
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
