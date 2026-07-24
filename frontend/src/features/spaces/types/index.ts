export type SpaceType =
  | "HOME"
  | "FAMILY"
  | "WORK"
  | "PROJECT"
  | "TRAVEL"
  | "HEALTH"
  | "FINANCE"
  | "VEHICLE"
  | "EDUCATION"
  | "COLLECTION"
  | "BLANK";

/** Product visibility model mapped for UI; NovaCore spaces are private to the owner until Sharing ships. */
export type SpaceVisibility = "PRIVATE" | "TEAM" | "PUBLIC";

export interface Space {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: SpaceType;
  favorite: boolean;
  archived: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpacePayload {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  type?: SpaceType;
}

export interface UpdateSpacePayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  type?: SpaceType;
  favorite?: boolean;
  displayOrder?: number;
}

export interface SpaceListParams {
  q?: string;
  type?: SpaceType | "ALL";
  visibility?: SpaceVisibility | "ALL";
  favoritesOnly?: boolean;
  archivedOnly?: boolean;
  ownerId?: string | "ALL";
  createdFrom?: string;
  createdTo?: string;
  /** Placeholder until list responses include storage metrics. */
  storageUsage?: "ALL" | "EMPTY" | "USED";
  sortBy?: SpaceSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export type SpaceSortField =
  | "name"
  | "createdAt"
  | "updatedAt"
  | "type"
  | "favorite"
  | "assetsCount"
  | "storageUsed";

export interface SpaceListResult {
  items: Space[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface SpaceAssetSummary {
  id: string;
  name: string;
  assetType: string;
  fileSize: number | null;
  createdAt: string;
}

export interface SpaceStatistics {
  assetCount: number;
  totalBytes: number;
  formattedSize: string;
  recentAssets: SpaceAssetSummary[];
}

export const SPACE_TYPES: SpaceType[] = [
  "BLANK",
  "HOME",
  "FAMILY",
  "WORK",
  "PROJECT",
  "TRAVEL",
  "HEALTH",
  "FINANCE",
  "VEHICLE",
  "EDUCATION",
  "COLLECTION",
];
