import { STORAGE_KEYS } from "@/constants";
import type { SharingStoreState } from "@/features/sharing/types";

const EMPTY_STORE: SharingStoreState = {
  shares: [],
  publicLinks: [],
};

export function readSharingStore(): SharingStoreState {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SHARING_STORE);
    if (!raw) {
      return { shares: [], publicLinks: [] };
    }
    const parsed = JSON.parse(raw) as SharingStoreState;
    return {
      shares: Array.isArray(parsed.shares) ? parsed.shares : [],
      publicLinks: Array.isArray(parsed.publicLinks) ? parsed.publicLinks : [],
    };
  } catch {
    return { shares: [], publicLinks: [] };
  }
}

export function writeSharingStore(state: SharingStoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.SHARING_STORE, JSON.stringify(state));
}

export function updateSharingStore(
  updater: (current: SharingStoreState) => SharingStoreState,
): SharingStoreState {
  const next = updater(readSharingStore());
  writeSharingStore(next);
  return next;
}
