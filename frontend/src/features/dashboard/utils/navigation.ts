import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  FolderIcon,
  HardDriveIcon,
  HeartIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  FilesIcon,
  SparklesIcon,
} from "lucide-react";

import { ROUTES } from "@/constants";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  permissions?: string[];
  comingSoon?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboardIcon,
    permissions: ["dashboard:read"],
  },
  {
    id: "spaces",
    label: "Spaces",
    href: ROUTES.SPACES,
    icon: FolderIcon,
    permissions: ["spaces:read"],
  },
  {
    id: "assets",
    label: "Assets",
    href: ROUTES.ASSETS,
    icon: FilesIcon,
    permissions: ["assets:read"],
    // Page exists as Coming Soon only — keep badge; do not treat as full feature.
    comingSoon: true,
  },
  {
    id: "favorites",
    label: "Favorites",
    href: ROUTES.FAVORITES,
    icon: HeartIcon,
    permissions: ["spaces:read", "assets:read"],
  },
  {
    id: "shared",
    label: "Shared",
    href: ROUTES.SHARED,
    icon: Share2Icon,
    permissions: ["spaces:read", "assets:read"],
  },
  {
    id: "search",
    label: "Search",
    href: ROUTES.SEARCH,
    icon: SearchIcon,
    permissions: ["search:read"],
  },
  {
    id: "notifications",
    label: "Notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: BellIcon,
    permissions: ["dashboard:read"],
  },
  {
    id: "storage",
    label: "Storage",
    href: ROUTES.ANALYTICS,
    icon: HardDriveIcon,
    permissions: ["dashboard:read"],
  },
  {
    id: "ai",
    label: "Assistant",
    href: ROUTES.AI,
    icon: SparklesIcon,
    permissions: ["dashboard:read"],
  },
  {
    id: "settings",
    label: "Settings",
    href: ROUTES.SETTINGS,
    icon: SettingsIcon,
  },
];
