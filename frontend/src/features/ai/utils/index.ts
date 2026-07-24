import type {
  AssistantConversation,
  AssistantMessage,
} from "@/features/ai/types";

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyConversation(
  title = "New conversation",
): AssistantConversation {
  const now = new Date().toISOString();
  return {
    id: createId("conv"),
    title,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function createUserMessage(content: string): AssistantMessage {
  return {
    id: createId("msg"),
    role: "user",
    content: content.trim(),
    createdAt: new Date().toISOString(),
    status: "complete",
  };
}

export function createUnavailableSystemMessage(): AssistantMessage {
  return {
    id: createId("msg"),
    role: "system",
    content:
      "Assistant backend is not connected. This UI is ready for streaming responses once the AI/MCP service is configured. No model output was generated.",
    createdAt: new Date().toISOString(),
    status: "unavailable",
  };
}

export function sortConversations(
  conversations: AssistantConversation[],
): AssistantConversation[] {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function conversationPreview(
  conversation: AssistantConversation,
): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) {
    return "No messages yet";
  }
  return last.content.slice(0, 80);
}
