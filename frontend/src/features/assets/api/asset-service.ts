import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  Asset,
  GenerateAssetPayload,
  ImageGenStatus,
  UploadAssetPayload,
} from "@/features/assets/types";

const ASSET_PATHS = {
  root: "/v1/assets",
  upload: "/v1/assets/upload",
  generate: "/v1/assets/generate",
  generateStatus: "/v1/assets/generate/status",
  byId: (id: string) => `/v1/assets/${id}`,
  content: (id: string) => `/v1/assets/${id}/content`,
} as const;

export const assetService = {
  async getAssets(spaceId?: string): Promise<Asset[]> {
    const response = await apiClient.get<ApiResponse<Asset[]>>(ASSET_PATHS.root, {
      params: spaceId ? { spaceId } : undefined,
    });
    return response.data.data.filter((asset) => !asset.archived);
  },

  async getAsset(id: string): Promise<Asset> {
    const response = await apiClient.get<ApiResponse<Asset>>(ASSET_PATHS.byId(id));
    return response.data.data;
  },

  async uploadAsset(payload: UploadAssetPayload): Promise<Asset> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("spaceId", payload.spaceId);
    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }

    const response = await apiClient.post<ApiResponse<Asset>>(
      ASSET_PATHS.upload,
      formData,
      {
        timeout: 120_000,
        transformRequest: [
          (data, headers) => {
            if (typeof FormData !== "undefined" && data instanceof FormData) {
              delete headers["Content-Type"];
            }
            return data;
          },
        ],
      },
    );
    return response.data.data;
  },

  async getImageGenStatus(): Promise<ImageGenStatus> {
    const response = await apiClient.get<ApiResponse<ImageGenStatus>>(
      ASSET_PATHS.generateStatus,
      { timeout: 8_000 },
    );
    return response.data.data;
  },

  async generateAsset(payload: GenerateAssetPayload): Promise<Asset> {
    const formData = new FormData();
    formData.append("spaceId", payload.spaceId);
    formData.append("prompt", payload.prompt);
    formData.append("adultConfirmed", payload.adultConfirmed ? "true" : "false");
    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const response = await apiClient.post<ApiResponse<Asset>>(
      ASSET_PATHS.generate,
      formData,
      {
        timeout: 2_700_000,
        transformRequest: [
          (data, headers) => {
            if (typeof FormData !== "undefined" && data instanceof FormData) {
              delete headers["Content-Type"];
            }
            return data;
          },
        ],
      },
    );
    return response.data.data;
  },

  async deleteAsset(id: string): Promise<Asset> {
    const response = await apiClient.delete<ApiResponse<Asset>>(
      ASSET_PATHS.byId(id),
    );
    return response.data.data;
  },

  /** Fetches binary content (inline or download disposition is server-side). */
  async getContentBlob(id: string, download = false): Promise<Blob> {
    const response = await apiClient.get<Blob>(ASSET_PATHS.content(id), {
      params: download ? { download: true } : undefined,
      responseType: "blob",
      timeout: 120_000,
    });
    return response.data;
  },

  async downloadAsset(asset: Asset): Promise<void> {
    if (!asset.contentAvailable) {
      throw new Error("This asset has no stored file to download.");
    }
    const blob = await this.getContentBlob(asset.id, true);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      asset.originalFilename?.trim() || asset.name || "download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};

export function isImageAsset(asset: Pick<Asset, "mimeType">): boolean {
  return Boolean(asset.mimeType?.toLowerCase().startsWith("image/"));
}

export function canViewAssetContent(
  asset: Pick<Asset, "contentAvailable">,
): boolean {
  return asset.contentAvailable;
}

export { ASSET_PATHS };
