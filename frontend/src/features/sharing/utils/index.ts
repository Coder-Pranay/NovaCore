import type {
  PublicLink,
  SharePermission,
  SharedAccess,
  SharedListParams,
  SharedListResult,
  ShareStatus,
} from "@/features/sharing/types";

export function permissionLabel(permission: SharePermission): string {
  switch (permission) {
    case "VIEWER":
      return "Viewer";
    case "COMMENTER":
      return "Commenter";
    case "EDITOR":
      return "Editor";
    case "OWNER":
      return "Owner";
    default:
      return permission;
  }
}

export function statusLabel(status: ShareStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING":
      return "Pending";
    case "EXPIRED":
      return "Expired";
    case "REVOKED":
      return "Revoked";
    default:
      return status;
  }
}

export function isShareExpired(share: SharedAccess | PublicLink): boolean {
  if (!share.expiresAt) {
    return false;
  }
  return new Date(share.expiresAt).getTime() < Date.now();
}

export function resolveShareStatus(share: SharedAccess): ShareStatus {
  if (share.status === "REVOKED") {
    return "REVOKED";
  }
  if (isShareExpired(share)) {
    return "EXPIRED";
  }
  return share.status;
}

export function createShareId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `share-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPublicToken(): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return raw.slice(0, 24);
}

export function buildPublicLinkUrl(token: string): string {
  if (typeof window === "undefined") {
    return `/shared/link/${token}`;
  }
  return `${window.location.origin}/shared/link/${token}`;
}

export function filterSharedItems(
  shares: SharedAccess[],
  publicLinks: PublicLink[],
  params: SharedListParams = {},
): SharedListResult {
  const {
    q = "",
    direction = "ALL",
    status = "ALL",
    permission = "ALL",
    visibility = "ALL",
    resourceType = "ALL",
    sortBy = "createdAt",
    sortDir = "desc",
    page = 0,
    size = 20,
  } = params;

  const query = q.trim().toLowerCase();

  let filtered = shares
    .map((share) => ({ ...share, status: resolveShareStatus(share) }))
    .filter((share) => {
      if (direction !== "ALL" && share.direction !== direction) {
        return false;
      }
      if (status !== "ALL" && share.status !== status) {
        return false;
      }
      if (permission !== "ALL" && share.permission !== permission) {
        return false;
      }
      if (resourceType !== "ALL" && share.resourceType !== resourceType) {
        return false;
      }
      if (visibility === "PUBLIC") {
        return false;
      }
      if (query) {
        const haystack = [
          share.resourceName,
          share.email,
          share.displayName ?? "",
          share.permission,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

  if (visibility === "PUBLIC") {
    filtered = [];
  }

  filtered = [...filtered].sort((a, b) => {
    const directionMul = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return a.resourceName.localeCompare(b.resourceName) * directionMul;
      case "permission":
        return a.permission.localeCompare(b.permission) * directionMul;
      case "expiresAt":
        return (a.expiresAt ?? "").localeCompare(b.expiresAt ?? "") * directionMul;
      case "createdAt":
      default:
        return a.createdAt.localeCompare(b.createdAt) * directionMul;
    }
  });

  const total = filtered.length;
  const safeSize = Math.min(Math.max(size, 1), 50);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const safePage = Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0));
  const start = safePage * safeSize;

  const enriched = shares.map((share) => ({
    ...share,
    status: resolveShareStatus(share),
  }));

  return {
    items: filtered.slice(start, start + safeSize),
    total,
    page: safePage,
    size: safeSize,
    totalPages,
    incoming: enriched.filter((share) => share.direction === "INCOMING"),
    outgoing: enriched.filter((share) => share.direction === "OUTGOING"),
    pending: enriched.filter((share) => share.status === "PENDING"),
    expired: enriched.filter((share) => share.status === "EXPIRED"),
    recentlyShared: [...enriched]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
    publicLinks: publicLinks.filter((link) => {
      if (visibility === "PRIVATE") {
        return false;
      }
      if (resourceType !== "ALL" && link.resourceType !== resourceType) {
        return false;
      }
      if (status === "EXPIRED") {
        return isShareExpired(link) || !link.enabled;
      }
      if (status === "ACTIVE") {
        return link.enabled && !isShareExpired(link);
      }
      return true;
    }),
  };
}
