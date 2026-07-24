"use client";

import { AppSidebar } from "@/features/dashboard/layouts/app-sidebar";
import { AppTopbar } from "@/features/dashboard/layouts/app-topbar";
import { MobileNavDrawer } from "@/features/dashboard/layouts/mobile-nav-drawer";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background flex min-h-full">
      <AppSidebar />
      <MobileNavDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main id="main-content" className="flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
