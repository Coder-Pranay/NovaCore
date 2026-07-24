export type FavoriteEntityType = "SPACE" | "ASSET";

export type FavoriteSortField =
  | "name"
  | "favoritedAt"
  | "entityType"
  | "alphabetical";

export type FavoriteFilterType = "ALL" | "SPACE" | "ASSET" | "PINNED" | "RECENT";

export interface FavoriteAssetSnapshot {
  id: string;
  ownerId: string;
  spaceId: string;
  name: string;
  description: string | null;
  assetType: string;
  mimeType: string | null;
  fileSize: number | null;
  originalFilename: string | null;
  extension: string | null;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  name: string;
  description: string | null;
  ownerId: string;
  spaceId?: string;
  assetType?: string;
  pinned: boolean;
  favoritedAt: string;
  createdAt: string;
  updatedAt: string;
  rawSpace?: import("@/features/spaces/types").Space;
  rawAsset?: FavoriteAssetSnapshot;
}

export interface FavoriteListParams {
  q?: string;
  type?: FavoriteFilterType;
  ownerId?: string | "ALL";
  sortBy?: FavoriteSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface FavoriteListResult {
  items: FavoriteItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  spaces: FavoriteItem[];
  assets: FavoriteItem[];
  pinned: FavoriteItem[];
  recent: FavoriteItem[];
}

export interface FavoriteTarget {
  entityType: FavoriteEntityType;
  entityId: string;
  favorite: boolean;
  space?: import("@/features/spaces/types").Space;
  asset?: FavoriteAssetSnapshot;
}

export interface UpdateAssetFavoritePayload {
  name: string;
  description?: string | null;
  assetType?: string;
  mimeType?: string | null;
  fileSize?: number | null;
  originalFilename?: string | null;
  extension?: string | null;
  favorite: boolean;
}
