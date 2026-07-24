"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { SidebarNav } from "@/features/dashboard/layouts/app-sidebar";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils";

export function MobileNavDrawer() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-label="Close navigation menu"
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">{APP_NAME}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </aside>
    </div>
  );
}
