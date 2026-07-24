"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, ROUTES } from "@/constants";
import { useAuth } from "@/hooks/use-auth";
import { canAccess } from "@/features/auth/utils/authorization";
import { PRIMARY_NAV } from "@/features/dashboard/utils/navigation";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = PRIMARY_NAV.filter((item) => {
    if (!item.roles?.length && !item.permissions?.length) {
      return true;
    }

    return canAccess(user, {
      roles: item.roles,
      permissions: item.permissions,
    });
  });

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          !item.comingSoon &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        const className = cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          item.comingSoon && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground",
          collapsed && "justify-center px-2",
        );

        const label = (
          <>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed ? (
              <span className="flex flex-1 items-center justify-between gap-2">
                {item.label}
                {item.comingSoon ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                ) : null}
              </span>
            ) : null}
          </>
        );

        if (item.comingSoon) {
          return (
            <span
              key={item.id}
              role="link"
              aria-disabled="true"
              className={className}
              title={collapsed ? `${item.label} (coming soon)` : "Coming soon"}
            >
              {label}
            </span>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            prefetch
            onClick={() => onNavigate?.()}
            aria-current={active ? "page" : undefined}
            className={className}
            title={collapsed ? item.label : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-full flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-64",
        className,
      )}
      aria-label="Application sidebar"
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link
          href={ROUTES.DASHBOARD}
          className="flex items-center gap-2 font-semibold"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-xs">
            NC
          </span>
          {!collapsed ? <span>{APP_NAME}</span> : null}
        </Link>
      </div>

      <div className="flex flex-1 flex-col py-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full", !collapsed && "justify-start")}
          onClick={toggleSidebarCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRightIcon className="size-4" />
          ) : (
            <>
              <ChevronsLeftIcon className="size-4" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
