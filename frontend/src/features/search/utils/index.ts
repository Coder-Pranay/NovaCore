import { STORAGE_KEYS } from "@/constants";

const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const normalized = query.trim();
  if (!normalized) {
    return getRecentSearches();
  }

  const next = [
    normalized,
    ...getRecentSearches().filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
  }

  return next;
}

export function clearRecentSearches(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }
}

export function highlightSegments(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q) {
    return [{ text, match: false }];
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  return text
    .split(regex)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === q.toLowerCase(),
    }));
}
