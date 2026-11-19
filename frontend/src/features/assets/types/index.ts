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

export interface ImageGenStatus {
  available: boolean;
  ready: boolean;
  busy?: boolean;
  step?: number;
  steps?: number;
  percent?: number;
  etaSeconds?: number | null;
  device: string | null;
  model: string | null;
  lora: string | null;
  message: string | null;
}

export interface GenerateAssetPayload {
  spaceId: string;
  prompt: string;
  description?: string;
  adultConfirmed: boolean;
  image?: File | null;
}
