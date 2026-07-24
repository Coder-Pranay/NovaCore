import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  CreateSpacePayload,
  Space,
  SpaceAssetSummary,
  SpaceListParams,
  SpaceListResult,
  SpaceStatistics,
  UpdateSpacePayload,
} from "@/features/spaces/types";
import {
  filterAndPaginateSpaces,
  normalizeColor,
  normalizeOptional,
} from "@/features/spaces/utils";
import { formatFileSize } from "@/utils/file-size";

const SPACE_PATHS = {
  root: "/v1/spaces",
  byId: (id: string) => `/v1/spaces/${id}`,
  assets: "/v1/assets",
} as const;

export const spaceService = {
  async getSpaces(): Promise<Space[]> {
    const response = await apiClient.get<ApiResponse<Space[]>>(SPACE_PATHS.root);
    return response.data.data;
  },

  async searchSpaces(params: SpaceListParams = {}): Promise<SpaceListResult> {
    const spaces = await this.getSpaces();
    return filterAndPaginateSpaces(spaces, params);
  },

  async getSpaceById(id: string): Promise<Space> {
    const response = await apiClient.get<ApiResponse<Space>>(SPACE_PATHS.byId(id));
    return response.data.data;
  },

  async createSpace(payload: CreateSpacePayload): Promise<Space> {
    const body = {
      name: payload.name.trim(),
      slug: normalizeOptional(payload.slug) ?? undefined,
      description: normalizeOptional(payload.description),
      icon: normalizeOptional(payload.icon),
      color: normalizeColor(payload.color),
      type: payload.type ?? "BLANK",
    };

    const response = await apiClient.post<ApiResponse<Space>>(SPACE_PATHS.root, body);
    return response.data.data;
  },

  async updateSpace(id: string, payload: UpdateSpacePayload): Promise<Space> {
    const body = {
      name: payload.name.trim(),
      description: normalizeOptional(payload.description),
      icon: normalizeOptional(payload.icon),
      color: normalizeColor(payload.color),
      type: payload.type,
      favorite: payload.favorite,
      displayOrder: payload.displayOrder,
    };

    const response = await apiClient.put<ApiResponse<Space>>(
      SPACE_PATHS.byId(id),
      body,
    );
    return response.data.data;
  },

  async archiveSpace(id: string): Promise<Space> {
    const response = await apiClient.delete<ApiResponse<Space>>(SPACE_PATHS.byId(id));
    return response.data.data;
  },

  /**
   * Soft-delete is archive-only on the current backend.
   * Kept as an alias for clearer UI semantics on destructive flows.
   */
  async deleteSpace(id: string): Promise<Space> {
    return this.archiveSpace(id);
  },

  /**
   * Restore is not supported by the current Spaces API (archived list is hidden).
   * Throws a controlled error so the UI can show a clear message.
   */
  async restoreSpace(id: string): Promise<never> {
    void id;
    throw new Error(
      "Restoring archived spaces is not available yet. The API only lists active spaces.",
    );
  },

  async favoriteSpace(space: Space, favorite: boolean): Promise<Space> {
    return this.updateSpace(space.id, {
      name: space.name,
      description: space.description,
      icon: space.icon,
      color: space.color,
      type: space.type,
      favorite,
      displayOrder: space.displayOrder,
    });
  },

  async getSpaceStatistics(spaceId: string): Promise<SpaceStatistics> {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          name: string;
          assetType: string;
          fileSize: number | null;
          createdAt: string;
        }>
      >
    >(SPACE_PATHS.assets, { params: { spaceId } });

    const assets = response.data.data;
    const totalBytes = assets.reduce((sum, asset) => sum + (asset.fileSize ?? 0), 0);
    const recentAssets: SpaceAssetSummary[] = [...assets]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType,
        fileSize: asset.fileSize,
        createdAt: asset.createdAt,
      }));

    return {
      assetCount: assets.length,
      totalBytes,
      formattedSize: formatFileSize(totalBytes),
      recentAssets,
    };
  },
};

export { SPACE_PATHS };
