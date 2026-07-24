"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/ui/loader";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROUTES } from "@/constants";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Breadcrumbs } from "@/features/dashboard/layouts/breadcrumbs";
import { getInitials } from "@/features/dashboard/utils";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils";

export function AppTopbar() {
  const router = useRouter();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Account";

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileNav}
          aria-label="Open navigation menu"
        >
          <MenuIcon className="size-5" />
        </Button>

        <Breadcrumbs className="hidden min-w-0 flex-1 sm:block" />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href={ROUTES.SEARCH}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-muted-foreground hidden gap-2 sm:inline-flex",
            )}
            aria-label="Open search"
          >
            <SearchIcon className="size-4" />
            <span>Search</span>
            <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </Link>

          <Link
            href={ROUTES.SEARCH}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "sm:hidden",
            )}
            aria-label="Open search"
          >
            <SearchIcon className="size-4" />
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden gap-2 lg:inline-flex"
            disabled
            aria-label="Workspace switcher (coming soon)"
          >
            Personal
            <ChevronsUpDownIcon className="size-3.5" />
          </Button>

          <NotificationBell />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="User menu"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-2 px-1.5",
              )}
            >
              <Avatar className="size-8">
                {user?.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt="" />
                ) : null}
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm md:inline">
                {displayName}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={8} className="min-w-56">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate font-medium">{displayName}</p>
                <p className="text-muted-foreground truncate text-xs font-normal">
                  {user?.email ?? user?.username}
                </p>
                {user?.roles?.[0] ? (
                  <Badge variant="secondary" className="mt-1">
                    {user.roles[0]}
                  </Badge>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(ROUTES.PROFILE)}>
                <UserIcon className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(ROUTES.SETTINGS)}>
                <SettingsIcon className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? (
                  <Loader size="sm" label="Signing out" />
                ) : (
                  <LogOutIcon className="size-4" />
                )}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
