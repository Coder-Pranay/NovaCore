"use client";

import { useEffect, useState } from "react";
import { WifiOffIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export function OfflineView() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <EmptyState
        className="py-4"
        title="You are offline"
        description="Some actions may be unavailable until your connection is restored."
        icon={WifiOffIcon}
      />
    </div>
  );
}
