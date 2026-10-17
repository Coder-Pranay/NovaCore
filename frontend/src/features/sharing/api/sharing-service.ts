import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type {
  CreatePublicLinkPayload,
  PublicLink,
  PublicLinkAccess,
  PublicLinkPreview,
  ShareInvitePayload,
  ShareResource,
  SharedAccess,
  SharedListParams,
  SharedListResult,
  UpdatePermissionPayload,
} from "@/features/sharing/types";
import {
  readSharingStore,
  updateSharingStore,
} from "@/features/sharing/api/sharing-store";
import {
  buildPublicLinkUrl,
  createShareId,
  filterSharedItems,
} from "@/features/sharing/utils";

const PUBLIC_LINK_PATHS = {
  root: "/v1/public-links",
  resource: "/v1/public-links/resource",
  byId: (id: string) => `/v1/public-links/${id}`,
  preview: (token: string) => `/v1/public-links/open/${encodeURIComponent(token)}`,
  access: (token: string) => `/v1/public-links/open/${encodeURIComponent(token)}`,
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function toExpiresAtIso(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("T")) {
    return trimmed;
  }
  return `${trimmed}T23:59:59.000Z`;
}

function mapPublicLink(data: PublicLink): PublicLink {
  return {
    ...data,
    url: data.url?.startsWith("http")
      ? data.url
      : buildPublicLinkUrl(data.token),
    expiresAt: data.expiresAt ?? null,
  };
}

export const sharingService = {
  async getSharedItems(params: SharedListParams = {}): Promise<SharedListResult> {
    const store = readSharingStore();
    let publicLinks = store.publicLinks;

    try {
      const response = await apiClient.get<ApiResponse<PublicLink[]>>(
        PUBLIC_LINK_PATHS.root,
      );
      publicLinks = (response.data.data ?? []).map(mapPublicLink);
    } catch {
      // Invites remain local; public links fall back to last known local cache.
    }

    return filterSharedItems(store.shares, publicLinks, params);
  },

  async getSharedUsers(resource: ShareResource): Promise<SharedAccess[]> {
    const store = readSharingStore();
    return store.shares.filter(
      (share) =>
        share.resourceType === resource.resourceType &&
        share.resourceId === resource.resourceId &&
        share.status !== "REVOKED",
    );
  },

  async shareSpace(
    resource: ShareResource,
    payload: ShareInvitePayload,
    invitedBy: string,
  ): Promise<SharedAccess> {
    return this.shareResource(resource, payload, invitedBy);
  },

  async shareAsset(
    resource: ShareResource,
    payload: ShareInvitePayload,
    invitedBy: string,
  ): Promise<SharedAccess> {
    return this.shareResource(resource, payload, invitedBy);
  },

  async shareResource(
    resource: ShareResource,
    payload: ShareInvitePayload,
    invitedBy: string,
  ): Promise<SharedAccess> {
    const email = payload.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required.");
    }

    const share: SharedAccess = {
      id: createShareId(),
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      resourceName: resource.resourceName,
      email,
      displayName: null,
      permission: payload.permission,
      direction: "OUTGOING",
      status: "PENDING",
      expiresAt: payload.expiresAt || null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      invitedBy,
    };

    updateSharingStore((current) => {
      const existing = current.shares.findIndex(
        (item) =>
          item.resourceType === resource.resourceType &&
          item.resourceId === resource.resourceId &&
          item.email === email &&
          item.status !== "REVOKED",
      );

      if (existing >= 0) {
        const nextShares = [...current.shares];
        nextShares[existing] = {
          ...nextShares[existing]!,
          permission: payload.permission,
          expiresAt: payload.expiresAt || null,
          status: "PENDING",
          updatedAt: nowIso(),
        };
        return { ...current, shares: nextShares };
      }

      return { ...current, shares: [share, ...current.shares] };
    });

    return share;
  },

  async updatePermission(
    shareId: string,
    payload: UpdatePermissionPayload,
  ): Promise<SharedAccess> {
    let updated: SharedAccess | null = null;

    updateSharingStore((current) => {
      const shares = current.shares.map((share) => {
        if (share.id !== shareId) {
          return share;
        }
        updated = {
          ...share,
          permission: payload.permission,
          expiresAt:
            payload.expiresAt === undefined
              ? share.expiresAt
              : payload.expiresAt,
          updatedAt: nowIso(),
          status: "ACTIVE",
        };
        return updated;
      });
      return { ...current, shares };
    });

    if (!updated) {
      throw new Error("Share not found.");
    }
    return updated;
  },

  async removeAccess(shareId: string): Promise<SharedAccess> {
    let removed: SharedAccess | null = null;

    updateSharingStore((current) => {
      const shares = current.shares.map((share) => {
        if (share.id !== shareId) {
          return share;
        }
        removed = {
          ...share,
          status: "REVOKED",
          updatedAt: nowIso(),
        };
        return removed;
      });
      return { ...current, shares };
    });

    if (!removed) {
      throw new Error("Share not found.");
    }
    return removed;
  },

  async createPublicLink(
    resource: ShareResource,
    payload: CreatePublicLinkPayload = {},
  ): Promise<PublicLink> {
    const body = {
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      resourceName: resource.resourceName,
      expiresAt: toExpiresAtIso(payload.expiresAt),
      passwordProtected: Boolean(payload.passwordProtected),
      password: payload.passwordProtected
        ? (payload.password ?? undefined)
        : undefined,
    };

    const response = await apiClient.post<ApiResponse<PublicLink>>(
      PUBLIC_LINK_PATHS.root,
      body,
    );
    const link = mapPublicLink(response.data.data);

    updateSharingStore((current) => {
      const others = current.publicLinks.filter(
        (item) =>
          !(
            item.resourceType === resource.resourceType &&
            item.resourceId === resource.resourceId
          ),
      );
      return { ...current, publicLinks: [link, ...others] };
    });

    return link;
  },

  async disablePublicLink(linkId: string): Promise<PublicLink> {
    const response = await apiClient.delete<ApiResponse<PublicLink>>(
      PUBLIC_LINK_PATHS.byId(linkId),
    );
    const disabled = mapPublicLink(response.data.data);

    updateSharingStore((current) => {
      const publicLinks = current.publicLinks.map((link) =>
        link.id === linkId ? disabled : link,
      );
      return { ...current, publicLinks };
    });

    return disabled;
  },

  async getPublicLink(resource: ShareResource): Promise<PublicLink | null> {
    const response = await apiClient.get<ApiResponse<PublicLink | null>>(
      PUBLIC_LINK_PATHS.resource,
      {
        params: {
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
        },
      },
    );

    const data = response.data.data;
    if (!data) {
      return null;
    }
    return mapPublicLink(data);
  },

  async previewPublicLink(token: string): Promise<PublicLinkPreview> {
    const response = await apiClient.get<ApiResponse<PublicLinkPreview>>(
      PUBLIC_LINK_PATHS.preview(token),
      { _skipAuthRefresh: true } as never,
    );
    return response.data.data;
  },

  async accessPublicLink(
    token: string,
    password?: string,
  ): Promise<PublicLinkAccess> {
    const response = await apiClient.post<ApiResponse<PublicLinkAccess>>(
      PUBLIC_LINK_PATHS.access(token),
      { password: password ?? "" },
      { _skipAuthRefresh: true } as never,
    );
    return response.data.data;
  },

  async copyLink(url: string): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard is not available in this browser.");
    }
    await navigator.clipboard.writeText(url);
  },
};
