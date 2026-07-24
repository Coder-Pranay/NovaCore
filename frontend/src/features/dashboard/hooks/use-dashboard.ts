"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { dashboardService } from "@/features/dashboard/api/dashboard-service";
import {
  deriveRecentSpaces,
  storageRemainingBytes,
} from "@/features/dashboard/utils";
import { formatFileSize } from "@/utils/file-size";

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: () => dashboardService.getDashboardSummary(),
    staleTime: 60_000,
  });
}

export function useStorageSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: () => dashboardService.getDashboardSummary(),
    staleTime: 60_000,
    select: (summary) => {
      const remaining = storageRemainingBytes(summary.storage.totalBytesUsed);
      return {
        ...summary.storage,
        remainingBytes: remaining,
        formattedRemaining: formatFileSize(remaining),
      };
    },
  });
}

export function useRecentAssets() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: () => dashboardService.getDashboardSummary(),
    staleTime: 60_000,
    select: (summary) => summary.assets.recentUploads,
  });
}

export function useRecentSpaces() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: () => dashboardService.getDashboardSummary(),
    staleTime: 60_000,
    select: (summary) => deriveRecentSpaces(summary.assets.recentUploads),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.activity,
    queryFn: () => dashboardService.getRecentActivity(),
    staleTime: 30_000,
  });
}
