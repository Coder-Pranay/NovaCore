export type AssetType =
  | "FILE"
  | "PHOTO"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "NOTE"
  | "OTHER";

export interface Asset {
  id: string;
  ownerId: string;
  spaceId: string;
  name: string;
  description: string | null;
  assetType: AssetType | string;
  mimeType: string | null;
  fileSize: number | null;
  contentAvailable: boolean;
  originalFilename: string | null;
  extension: string | null;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadAssetPayload {
  file: File;
  spaceId: string;
  description?: string;
}

export interface UploadAssetsPayload {
  files: File[];
  spaceId: string;
  description?: string;
}

export interface UploadAssetsResult {
  succeeded: number;
  failed: { name: string; message: string }[];
}
