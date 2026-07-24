import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import { dashboardService } from "@/features/dashboard/api/dashboard-service";
import { spaceService } from "@/features/spaces/api/space-service";
import type {
  AnalyticsAsset,
  AnalyticsDashboardData,
  AnalyticsRange,
  LargestFileItem,
  LargestSpaceItem,
  StorageTrendPoint,
  UploadTrendPoint,
} from "@/features/analytics/types";
import { buildAnalyticsDashboard } from "@/features/analytics/utils";

async function getAllAssets(): Promise<AnalyticsAsset[]> {
  const response = await apiClient.get<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        spaceId: string;
        assetType: string;
        fileSize: number | null;
        createdAt: string;
        archived?: boolean;
      }>
    >
  >("/v1/assets");

  return response.data.data
    .filter((asset) => !asset.archived)
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      spaceId: asset.spaceId,
      assetType: asset.assetType,
      fileSize: asset.fileSize,
      createdAt: asset.createdAt,
    }));
}

export const analyticsService = {
  async getDashboard(range: AnalyticsRange = "30d"): Promise<AnalyticsDashboardData> {
    const [summary, assets, spaces] = await Promise.all([
      dashboardService.getDashboardSummary(),
      getAllAssets(),
      spaceService.getSpaces(),
    ]);

    return buildAnalyticsDashboard(
      summary,
      assets,
      spaces.map((space) => ({ id: space.id, name: space.name })),
      range,
    );
  },

  async getStorageSummary(range: AnalyticsRange = "30d") {
    const data = await this.getDashboard(range);
    return data.summary;
  },

  async getStorageTrend(range: AnalyticsRange = "30d"): Promise<StorageTrendPoint[]> {
    const data = await this.getDashboard(range);
    return data.storageTrend;
  },

  async getLargestFiles(range: AnalyticsRange = "30d"): Promise<LargestFileItem[]> {
    const data = await this.getDashboard(range);
    return data.largestFiles;
  },

  async getLargestSpaces(range: AnalyticsRange = "30d"): Promise<LargestSpaceItem[]> {
    const data = await this.getDashboard(range);
    return data.largestSpaces;
  },

  async getUploadTrend(range: AnalyticsRange = "30d"): Promise<UploadTrendPoint[]> {
    const data = await this.getDashboard(range);
    return data.uploadTrend;
  },
};
