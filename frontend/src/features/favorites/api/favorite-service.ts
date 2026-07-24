import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import { spaceService } from "@/features/spaces/api/space-service";
import type { Space } from "@/features/spaces/types";
import type {
  FavoriteAssetSnapshot,
  FavoriteItem,
  FavoriteListParams,
  FavoriteListResult,
  FavoriteTarget,
} from "@/features/favorites/types";
import {
  filterAndPaginateFavorites,
  readPinnedFavoriteIds,
  togglePinnedFavoriteId,
} from "@/features/favorites/utils";

const ASSET_PATHS = {
  root: "/v1/assets",
  byId: (id: string) => `/v1/assets/${id}`,
} as const;

async function getFavoriteAssets(): Promise<FavoriteAssetSnapshot[]> {
  const response = await apiClient.get<ApiResponse<FavoriteAssetSnapshot[]>>(
    ASSET_PATHS.root,
  );
  return response.data.data.filter((asset) => asset.favorite && !asset.archived);
}

function toFavoriteItems(
  spaces: Space[],
  assets: FavoriteAssetSnapshot[],
  pins: Set<string>,
): FavoriteItem[] {
  const spaceItems: FavoriteItem[] = spaces
    .filter((space) => space.favorite && !space.archived)
    .map((space) => ({
      id: `SPACE:${space.id}`,
      entityType: "SPACE",
      entityId: space.id,
      name: space.name,
      description: space.description,
      ownerId: space.ownerId,
      pinned: pins.has(`SPACE:${space.id}`),
      favoritedAt: space.updatedAt,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      rawSpace: space,
    }));

  const assetItems: FavoriteItem[] = assets.map((asset) => ({
    id: `ASSET:${asset.id}`,
    entityType: "ASSET",
    entityId: asset.id,
    name: asset.name,
    description: asset.description,
    ownerId: asset.ownerId,
    spaceId: asset.spaceId,
    assetType: asset.assetType,
    pinned: pins.has(`ASSET:${asset.id}`),
    favoritedAt: asset.updatedAt,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    rawAsset: asset,
  }));

  return [...spaceItems, ...assetItems];
}

export const favoriteService = {
  async getFavorites(params: FavoriteListParams = {}): Promise<FavoriteListResult> {
    const [spaces, assets] = await Promise.all([
      spaceService.getSpaces(),
      getFavoriteAssets(),
    ]);
    const pins = readPinnedFavoriteIds();
    const items = toFavoriteItems(spaces, assets, pins);
    return filterAndPaginateFavorites(items, params);
  },

  async getAllFavoriteItems(): Promise<FavoriteItem[]> {
    const [spaces, assets] = await Promise.all([
      spaceService.getSpaces(),
      getFavoriteAssets(),
    ]);
    return toFavoriteItems(spaces, assets, readPinnedFavoriteIds());
  },

  async favorite(target: FavoriteTarget): Promise<FavoriteItem> {
    if (target.entityType === "SPACE") {
      if (!target.space) {
        throw new Error("Space payload is required to update favorite state.");
      }
      const space = await spaceService.favoriteSpace(target.space, true);
      const pins = readPinnedFavoriteIds();
      return {
        id: `SPACE:${space.id}`,
        entityType: "SPACE",
        entityId: space.id,
        name: space.name,
        description: space.description,
        ownerId: space.ownerId,
        pinned: pins.has(`SPACE:${space.id}`),
        favoritedAt: space.updatedAt,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        rawSpace: space,
      };
    }

    if (!target.asset) {
      throw new Error("Asset payload is required to update favorite state.");
    }

    const response = await apiClient.put<ApiResponse<FavoriteAssetSnapshot>>(
      ASSET_PATHS.byId(target.asset.id),
      {
        name: target.asset.name,
        description: target.asset.description,
        assetType: target.asset.assetType,
        mimeType: target.asset.mimeType,
        fileSize: target.asset.fileSize,
        originalFilename: target.asset.originalFilename,
        extension: target.asset.extension,
        favorite: true,
      },
    );
    const asset = response.data.data;
    const pins = readPinnedFavoriteIds();
    return {
      id: `ASSET:${asset.id}`,
      entityType: "ASSET",
      entityId: asset.id,
      name: asset.name,
      description: asset.description,
      ownerId: asset.ownerId,
      spaceId: asset.spaceId,
      assetType: asset.assetType,
      pinned: pins.has(`ASSET:${asset.id}`),
      favoritedAt: asset.updatedAt,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      rawAsset: asset,
    };
  },

  async unfavorite(target: FavoriteTarget): Promise<FavoriteItem | null> {
    if (target.entityType === "SPACE") {
      if (!target.space) {
        throw new Error("Space payload is required to update favorite state.");
      }
      await spaceService.favoriteSpace(target.space, false);
      return null;
    }

    if (!target.asset) {
      throw new Error("Asset payload is required to update favorite state.");
    }

    await apiClient.put<ApiResponse<FavoriteAssetSnapshot>>(
      ASSET_PATHS.byId(target.asset.id),
      {
        name: target.asset.name,
        description: target.asset.description,
        assetType: target.asset.assetType,
        mimeType: target.asset.mimeType,
        fileSize: target.asset.fileSize,
        originalFilename: target.asset.originalFilename,
        extension: target.asset.extension,
        favorite: false,
      },
    );
    return null;
  },

  async bulkFavorite(targets: FavoriteTarget[]): Promise<FavoriteItem[]> {
    const results: FavoriteItem[] = [];
    for (const target of targets) {
      results.push(await this.favorite({ ...target, favorite: true }));
    }
    return results;
  },

  async bulkUnfavorite(targets: FavoriteTarget[]): Promise<void> {
    for (const target of targets) {
      await this.unfavorite({ ...target, favorite: false });
    }
  },

  togglePin(itemId: string): Set<string> {
    return togglePinnedFavoriteId(itemId);
  },
};

export { ASSET_PATHS };
