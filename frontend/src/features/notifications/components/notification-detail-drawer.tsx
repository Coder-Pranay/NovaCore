"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppNotification } from "@/features/notifications/types";
import { categoryLabel } from "@/features/notifications/utils";
import { formatDateTime } from "@/utils";

interface NotificationDetailDrawerProps {
  notification: AppNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export function NotificationDetailDrawer({
  notification,
  open,
  onOpenChange,
  onDelete,
}: NotificationDetailDrawerProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{notification?.title ?? "Notification"}</DialogTitle>
          <DialogDescription>
            {notification
              ? `${categoryLabel(notification.category)} · ${formatDateTime(notification.createdAt)}`
              : null}
          </DialogDescription>
        </DialogHeader>

        {notification ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={notification.status === "UNREAD" ? "default" : "outline"}>
                {notification.status === "UNREAD" ? "Unread" : "Read"}
              </Badge>
              <Badge variant="secondary">
                {categoryLabel(notification.category)}
              </Badge>
              <Badge variant="outline">{notification.source}</Badge>
            </div>
            <p className="text-sm leading-relaxed">{notification.body}</p>
          </div>
        ) : null}

        <DialogFooter>
          {notification?.href ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                router.push(notification.href!);
                onOpenChange(false);
              }}
            >
              Open related item
            </Button>
          ) : null}
          {notification ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(notification.id)}
            >
              Delete
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
