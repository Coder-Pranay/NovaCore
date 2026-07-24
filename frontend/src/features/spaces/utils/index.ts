import type {
  Space,
  SpaceListParams,
  SpaceListResult,
  SpaceSortField,
  SpaceType,
  SpaceVisibility,
} from "@/features/spaces/types";

export function normalizeOptional(value?: string | null): string | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  return value.trim();
}

export function normalizeColor(value?: string | null): string | null {
  const normalized = normalizeOptional(value);
  if (!normalized) {
    return null;
  }
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

export function matchesSpaceQuery(space: Space, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    space.name.toLowerCase().includes(q) ||
    (space.description?.toLowerCase().includes(q) ?? false) ||
    space.slug.toLowerCase().includes(q) ||
    space.type.toLowerCase().includes(q)
  );
}

export function compareSpaces(
  a: Space,
  b: Space,
  sortBy: SpaceSortField,
  sortDir: "asc" | "desc",
): number {
  const direction = sortDir === "asc" ? 1 : -1;

  switch (sortBy) {
    case "name":
      return a.name.localeCompare(b.name) * direction;
    case "type":
      return a.type.localeCompare(b.type) * direction;
    case "favorite":
      return (Number(a.favorite) - Number(b.favorite)) * direction;
    case "assetsCount":
    case "storageUsed":
      // List payload does not include metrics yet — keep stable secondary sort by name.
      return a.name.localeCompare(b.name) * direction;
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt) * direction;
    case "createdAt":
    default:
      return a.createdAt.localeCompare(b.createdAt) * direction;
  }
}

function isWithinCreatedRange(
  createdAt: string,
  createdFrom?: string,
  createdTo?: string,
): boolean {
  if (createdFrom && createdAt < createdFrom) {
    return false;
  }
  if (createdTo && createdAt > `${createdTo}T23:59:59.999Z`) {
    return false;
  }
  return true;
}

export function filterAndPaginateSpaces(
  spaces: Space[],
  params: SpaceListParams = {},
): SpaceListResult {
  const {
    q = "",
    type = "ALL",
    visibility = "ALL",
    favoritesOnly = false,
    archivedOnly = false,
    ownerId = "ALL",
    createdFrom,
    createdTo,
    storageUsage = "ALL",
    sortBy = "updatedAt",
    sortDir = "desc",
    page = 0,
    size = 20,
  } = params;

  let filtered = spaces.filter((space) => {
    if (archivedOnly && !space.archived) {
      return false;
    }
    if (!archivedOnly && space.archived) {
      return false;
    }
    if (favoritesOnly && !space.favorite) {
      return false;
    }
    if (type !== "ALL" && space.type !== type) {
      return false;
    }
    // Until Sharing ships, every space is private to the owner.
    if (visibility !== "ALL" && visibility !== "PRIVATE") {
      return false;
    }
    if (ownerId !== "ALL" && space.ownerId !== ownerId) {
      return false;
    }
    if (!isWithinCreatedRange(space.createdAt, createdFrom, createdTo)) {
      return false;
    }
    if (!matchesSpaceQuery(space, q)) {
      return false;
    }
    // Storage metrics are not on the list response yet — filter is a no-op placeholder.
    void storageUsage;
    return true;
  });

  filtered = [...filtered].sort((a, b) => compareSpaces(a, b, sortBy, sortDir));

  const total = filtered.length;
  const safeSize = Math.min(Math.max(size, 1), 50);
  const totalPages = Math.max(1, Math.ceil(total / safeSize) || 1);
  const safePage = Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0));
  const start = safePage * safeSize;
  const items = filtered.slice(start, start + safeSize);

  return {
    items,
    total,
    page: safePage,
    size: safeSize,
    totalPages: total === 0 ? 0 : totalPages,
  };
}

export function spaceTypeLabel(type: SpaceType): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

/** Spaces are owner-private until Sharing is implemented. */
export function spaceVisibilityLabel(
  visibility?: SpaceVisibility,
): "Private" | "Team" | "Public" {
  if (visibility === "TEAM") return "Team";
  if (visibility === "PUBLIC") return "Public";
  return "Private";
}

export function getSpaceVisibility(_space?: Space): SpaceVisibility {
  void _space;
  return "PRIVATE";
}

export function splitHighlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q) {
    return [{ text, match: false }];
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.filter(Boolean).map((part) => ({
    text: part,
    match: part.toLowerCase() === q.toLowerCase(),
  }));
}
