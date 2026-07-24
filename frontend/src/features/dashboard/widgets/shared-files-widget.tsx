"use client";

import Link from "next/link";
import { Share2Icon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export function SharedFilesWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Shared files</CardTitle>
        <CardDescription>Files shared with you or by you</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          className="py-6"
          title="No shared files yet"
          description="Items you share will appear on the Shared page. Sharing is stored locally until the backend lands."
          icon={Share2Icon}
          action={
            <Link
              href={ROUTES.SHARED}
              className="border-border hover:bg-muted inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium"
            >
              Open Shared
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
