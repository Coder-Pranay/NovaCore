import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  DashboardSummary,
  RecentActivityItem,
} from "@/features/dashboard/types";
import {
  deriveRecentSpaces,
  storageRemainingBytes,
} from "@/features/dashboard/utils";
import { formatFileSize } from "@/utils/file-size";

const DASHBOARD_PATHS = {
  summary: "/v1/dashboard",
  activity: "/v1/dashboard/activity",
} as const;

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>(
      DASHBOARD_PATHS.summary,
    );
    return response.data.data;
  },

  async getStorageSummary() {
    const summary = await this.getDashboardSummary();
    const remaining = storageRemainingBytes(summary.storage.totalBytesUsed);

    return {
      ...summary.storage,
      remainingBytes: remaining,
      formattedRemaining: formatFileSize(remaining),
    };
  },

  async getRecentAssets() {
    const summary = await this.getDashboardSummary();
    return summary.assets.recentUploads;
  },

  async getRecentSpaces() {
    const summary = await this.getDashboardSummary();
    return deriveRecentSpaces(summary.assets.recentUploads);
  },

  async getRecentActivity(): Promise<RecentActivityItem[]> {
    const response = await apiClient.get<ApiResponse<RecentActivityItem[]>>(
      DASHBOARD_PATHS.activity,
    );
    return response.data.data;
  },
};

export { DASHBOARD_PATHS };
