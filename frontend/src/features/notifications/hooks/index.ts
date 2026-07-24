"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { notificationService } from "@/features/notifications/api/notification-service";
import type {
  NotificationListParams,
  NotificationPreferences,
} from "@/features/notifications/types";
import { getErrorMessage } from "@/utils";

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
  void queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.count });
}

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(params as Record<string, unknown>),
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.count,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      invalidateNotifications(queryClient);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to mark notification as read"));
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: (count) => {
      invalidateNotifications(queryClient);
      toast.success(
        count > 0 ? `Marked ${count} notifications as read` : "Nothing to mark",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to mark all as read"));
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      invalidateNotifications(queryClient);
      toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete notification"));
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.preferences,
    queryFn: () => notificationService.getPreferences(),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      notificationService.updatePreferences(preferences),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.preferences,
      });
      invalidateNotifications(queryClient);
      toast.success("Notification preferences saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update preferences"));
    },
  });
}
