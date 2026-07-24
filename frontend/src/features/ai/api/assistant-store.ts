import { STORAGE_KEYS } from "@/constants";
import type { AssistantStoreState } from "@/features/ai/types";

const EMPTY: AssistantStoreState = {
  conversations: [],
  activeConversationId: null,
};

export function readAssistantStore(): AssistantStoreState {
  if (typeof window === "undefined") {
    return EMPTY;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.ASSISTANT_STORE);
    if (!raw) {
      return { conversations: [], activeConversationId: null };
    }
    const parsed = JSON.parse(raw) as AssistantStoreState;
    return {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      activeConversationId: parsed.activeConversationId ?? null,
    };
  } catch {
    return { conversations: [], activeConversationId: null };
  }
}

export function writeAssistantStore(state: AssistantStoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.ASSISTANT_STORE,
    JSON.stringify(state),
  );
}

export function updateAssistantStore(
  updater: (current: AssistantStoreState) => AssistantStoreState,
): AssistantStoreState {
  const next = updater(readAssistantStore());
  writeAssistantStore(next);
  return next;
}
