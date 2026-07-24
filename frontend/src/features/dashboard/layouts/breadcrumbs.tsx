"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { ROUTES } from "@/constants";
import { cn } from "@/utils";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  spaces: "Spaces",
  assets: "Assets",
  favorites: "Favorites",
  shared: "Shared",
  search: "Search",
  notifications: "Notifications",
  analytics: "Analytics",
  ai: "Assistant",
  settings: "Settings",
  profile: "Profile",
  "change-password": "Change password",
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = LABEL_MAP[segment] ?? segment;
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        <li>
          <Link href={ROUTES.DASHBOARD} className="hover:text-foreground">
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {crumb.isLast ? (
              <span className="text-foreground truncate font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground truncate">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
