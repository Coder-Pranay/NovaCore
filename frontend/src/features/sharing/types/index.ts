export type ShareResourceType = "SPACE" | "ASSET";

export type SharePermission = "VIEWER" | "COMMENTER" | "EDITOR" | "OWNER";

export type ShareDirection = "INCOMING" | "OUTGOING";

export type ShareStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "REVOKED";

export type ShareVisibility = "PRIVATE" | "PUBLIC";

export interface ShareResource {
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
}

export interface SharedAccess {
  id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
  email: string;
  displayName: string | null;
  permission: SharePermission;
  direction: ShareDirection;
  status: ShareStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy: string;
}

export interface PublicLink {
  id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
  token: string;
  url: string;
  enabled: boolean;
  expiresAt: string | null;
  passwordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShareInvitePayload {
  email: string;
  permission: SharePermission;
  expiresAt?: string | null;
}

export interface CreatePublicLinkPayload {
  expiresAt?: string | null;
  passwordProtected?: boolean;
}

export interface UpdatePermissionPayload {
  permission: SharePermission;
  expiresAt?: string | null;
}

export interface SharedListParams {
  q?: string;
  direction?: ShareDirection | "ALL";
  status?: ShareStatus | "ALL";
  permission?: SharePermission | "ALL";
  visibility?: ShareVisibility | "ALL";
  resourceType?: ShareResourceType | "ALL";
  sortBy?: "name" | "createdAt" | "expiresAt" | "permission";
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface SharedListResult {
  items: SharedAccess[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  incoming: SharedAccess[];
  outgoing: SharedAccess[];
  pending: SharedAccess[];
  expired: SharedAccess[];
  recentlyShared: SharedAccess[];
  publicLinks: PublicLink[];
}

export interface SharingStoreState {
  shares: SharedAccess[];
  publicLinks: PublicLink[];
}

export const SHARE_PERMISSIONS: SharePermission[] = [
  "VIEWER",
  "COMMENTER",
  "EDITOR",
  "OWNER",
];
