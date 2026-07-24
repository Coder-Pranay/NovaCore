"use client";

import Link from "next/link";
import {
  FolderPlusIcon,
  HardDriveIcon,
  SearchIcon,
  UploadIcon,
  UserPlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
  icon: typeof FolderPlusIcon;
}

const ACTIONS: QuickAction[] = [
  {
    id: "create-space",
    title: "Create Space",
    description: "Organize a new Life Space",
    href: ROUTES.SPACES,
    icon: FolderPlusIcon,
  },
  {
    id: "upload-asset",
    title: "Upload Asset",
    description: "Assets module coming soon",
    comingSoon: true,
    icon: UploadIcon,
  },
  {
    id: "search-assets",
    title: "Search Assets",
    description: "Find anything across NovaCore",
    href: ROUTES.SEARCH,
    icon: SearchIcon,
  },
  {
    id: "invite-member",
    title: "Invite Member",
    description: "Share a Space with your team",
    href: ROUTES.SHARED,
    icon: UserPlusIcon,
  },
  {
    id: "manage-storage",
    title: "Manage Storage",
    description: "Review usage and capacity",
    href: ROUTES.STORAGE,
    icon: HardDriveIcon,
  },
];

export function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
        <CardDescription>Jump into common workflows</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const className = cn(
            "flex flex-col gap-2 rounded-lg border p-3 transition-colors outline-none",
            action.comingSoon
              ? "text-muted-foreground cursor-not-allowed opacity-70"
              : "hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-2",
          );

          const body = (
            <>
              <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                {action.title}
                {action.comingSoon ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                ) : null}
              </span>
              <span className="text-muted-foreground text-xs">{action.description}</span>
            </>
          );

          if (action.comingSoon || !action.href) {
            return (
              <div
                key={action.id}
                className={className}
                aria-disabled="true"
                title="Coming soon"
              >
                {body}
              </div>
            );
          }

          return (
            <Link key={action.id} href={action.href} prefetch className={className}>
              {body}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
