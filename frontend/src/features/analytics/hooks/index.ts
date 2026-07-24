"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { analyticsService } from "@/features/analytics/api/analytics-service";
import type { AnalyticsRange } from "@/features/analytics/types";

function useAnalyticsDashboard(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
  });
}

export function useStorageAnalytics(range: AnalyticsRange = "30d") {
  return useAnalyticsDashboard(range);
}

export function useStorageSummary(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
    select: (data) => data.summary,
  });
}

export function useStorageTrend(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
    select: (data) => data.storageTrend,
  });
}

export function useLargestFiles(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
    select: (data) => data.largestFiles,
  });
}

export function useLargestSpaces(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
    select: (data) => data.largestSpaces,
  });
}

export function useUploadTrend(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics.storageAnalytics, range],
    queryFn: () => analyticsService.getDashboard(range),
    staleTime: 60_000,
    select: (data) => data.uploadTrend,
  });
}
