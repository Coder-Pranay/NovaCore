import type {
  CreatePublicLinkPayload,
  PublicLink,
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
  createPublicToken,
  createShareId,
  filterSharedItems,
  isShareExpired,
} from "@/features/sharing/utils";

function nowIso(): string {
  return new Date().toISOString();
}

export const sharingService = {
  async getSharedItems(params: SharedListParams = {}): Promise<SharedListResult> {
    const store = readSharingStore();
    return filterSharedItems(store.shares, store.publicLinks, params);
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
    const token = createPublicToken();
    const link: PublicLink = {
      id: createShareId(),
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      resourceName: resource.resourceName,
      token,
      url: buildPublicLinkUrl(token),
      enabled: true,
      expiresAt: payload.expiresAt || null,
      passwordProtected: Boolean(payload.passwordProtected),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

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
    let disabled: PublicLink | null = null;

    updateSharingStore((current) => {
      const publicLinks = current.publicLinks.map((link) => {
        if (link.id !== linkId) {
          return link;
        }
        disabled = {
          ...link,
          enabled: false,
          updatedAt: nowIso(),
        };
        return disabled;
      });
      return { ...current, publicLinks };
    });

    if (!disabled) {
      throw new Error("Public link not found.");
    }
    return disabled;
  },

  async getPublicLink(resource: ShareResource): Promise<PublicLink | null> {
    const store = readSharingStore();
    const link =
      store.publicLinks.find(
        (item) =>
          item.resourceType === resource.resourceType &&
          item.resourceId === resource.resourceId,
      ) ?? null;

    if (!link) {
      return null;
    }

    if (isShareExpired(link) && link.enabled) {
      return this.disablePublicLink(link.id);
    }

    return link;
  },

  async copyLink(url: string): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard is not available in this browser.");
    }
    await navigator.clipboard.writeText(url);
  },
};
