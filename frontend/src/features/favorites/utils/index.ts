import { STORAGE_KEYS } from "@/constants";
import type {
  FavoriteFilterType,
  FavoriteItem,
  FavoriteListParams,
  FavoriteListResult,
  FavoriteSortField,
} from "@/features/favorites/types";

export function readPinnedFavoriteIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.FAVORITE_PINS);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function writePinnedFavoriteIds(ids: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.FAVORITE_PINS,
    JSON.stringify(Array.from(ids)),
  );
}

export function togglePinnedFavoriteId(id: string): Set<string> {
  const pins = readPinnedFavoriteIds();
  if (pins.has(id)) {
    pins.delete(id);
  } else {
    pins.add(id);
  }
  writePinnedFavoriteIds(pins);
  return pins;
}

export function matchesFavoriteQuery(item: FavoriteItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    item.name.toLowerCase().includes(q) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    item.entityType.toLowerCase().includes(q) ||
    (item.assetType?.toLowerCase().includes(q) ?? false)
  );
}

function compareFavorites(
  a: FavoriteItem,
  b: FavoriteItem,
  sortBy: FavoriteSortField,
  sortDir: "asc" | "desc",
): number {
  const direction = sortDir === "asc" ? 1 : -1;

  switch (sortBy) {
    case "alphabetical":
    case "name":
      return a.name.localeCompare(b.name) * direction;
    case "entityType":
      return a.entityType.localeCompare(b.entityType) * direction;
    case "favoritedAt":
    default:
      return a.favoritedAt.localeCompare(b.favoritedAt) * direction;
  }
}

export function filterAndPaginateFavorites(
  items: FavoriteItem[],
  params: FavoriteListParams = {},
): FavoriteListResult {
  const {
    q = "",
    type = "ALL",
    ownerId = "ALL",
    sortBy = "favoritedAt",
    sortDir = "desc",
    page = 0,
    size = 20,
  } = params;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  let filtered = items.filter((item) => {
    if (ownerId !== "ALL" && item.ownerId !== ownerId) {
      return false;
    }
    if (type === "SPACE" && item.entityType !== "SPACE") {
      return false;
    }
    if (type === "ASSET" && item.entityType !== "ASSET") {
      return false;
    }
    if (type === "PINNED" && !item.pinned) {
      return false;
    }
    if (type === "RECENT" && new Date(item.favoritedAt).getTime() < sevenDaysAgo) {
      return false;
    }
    return matchesFavoriteQuery(item, q);
  });

  filtered = [...filtered].sort((a, b) =>
    compareFavorites(a, b, sortBy, sortDir),
  );

  const total = filtered.length;
  const safeSize = Math.min(Math.max(size, 1), 50);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const safePage = Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0));
  const start = safePage * safeSize;
  const pageItems = filtered.slice(start, start + safeSize);

  const spaces = items.filter((item) => item.entityType === "SPACE");
  const assets = items.filter((item) => item.entityType === "ASSET");
  const pinned = items.filter((item) => item.pinned);
  const recent = [...items]
    .sort((a, b) => b.favoritedAt.localeCompare(a.favoritedAt))
    .slice(0, 8);

  return {
    items: pageItems,
    total,
    page: safePage,
    size: safeSize,
    totalPages,
    spaces,
    assets,
    pinned,
    recent,
  };
}

export function favoriteTypeLabel(type: FavoriteFilterType): string {
  switch (type) {
    case "SPACE":
      return "Spaces";
    case "ASSET":
      return "Assets";
    case "PINNED":
      return "Pinned";
    case "RECENT":
      return "Recently added";
    default:
      return "All";
  }
}

export function splitHighlight(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
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
