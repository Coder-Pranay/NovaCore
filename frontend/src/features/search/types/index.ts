export type SearchAssetType =
  | "FILE"
  | "FOLDER"
  | "NOTE"
  | "LINK"
  | "IMAGE"
  | "DOCUMENT"
  | "OTHER"
  | string;

export interface SearchSpaceResult {
  id: string;
  name: string;
  description: string | null;
  favorite: boolean;
  createdAt: string;
}

export interface SearchAssetResult {
  id: string;
  name: string;
  description: string | null;
  assetType: SearchAssetType;
  favorite: boolean;
  spaceId: string;
  spaceName: string;
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  spaces: SearchSpaceResult[];
  assets: SearchAssetResult[];
  totalSpaces: number;
  totalAssets: number;
}

export interface SearchParams {
  q: string;
  page?: number;
  size?: number;
}
