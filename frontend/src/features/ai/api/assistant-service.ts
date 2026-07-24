import {
  readAssistantStore,
  updateAssistantStore,
} from "@/features/ai/api/assistant-store";
import type {
  AssistantConversation,
  SendMessageRequest,
  SendMessageResponse,
  StreamChunk,
} from "@/features/ai/types";
import { AssistantNotAvailableError } from "@/features/ai/types";
import {
  createEmptyConversation,
  createUnavailableSystemMessage,
  createUserMessage,
  sortConversations,
} from "@/features/ai/utils";

/**
 * Assistant service — integration interface only.
 * Persists conversation chrome locally. Does not call or mock an AI model.
 */
export const assistantService = {
  async listConversations(): Promise<AssistantConversation[]> {
    return sortConversations(readAssistantStore().conversations);
  },

  async getConversation(id: string): Promise<AssistantConversation | null> {
    return (
      readAssistantStore().conversations.find((item) => item.id === id) ?? null
    );
  },

  async createConversation(title?: string): Promise<AssistantConversation> {
    const conversation = createEmptyConversation(title);
    updateAssistantStore((current) => ({
      conversations: [conversation, ...current.conversations],
      activeConversationId: conversation.id,
    }));
    return conversation;
  },

  async renameConversation(
    id: string,
    title: string,
  ): Promise<AssistantConversation> {
    let updated: AssistantConversation | null = null;
    updateAssistantStore((current) => ({
      ...current,
      conversations: current.conversations.map((item) => {
        if (item.id !== id) {
          return item;
        }
        updated = {
          ...item,
          title: title.trim(),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (!updated) {
      throw new Error("Conversation not found");
    }
    return updated;
  },

  async deleteConversation(id: string): Promise<void> {
    updateAssistantStore((current) => {
      const conversations = current.conversations.filter(
        (item) => item.id !== id,
      );
      return {
        conversations,
        activeConversationId:
          current.activeConversationId === id
            ? (conversations[0]?.id ?? null)
            : current.activeConversationId,
      };
    });
  },

  async pinConversation(
    id: string,
    pinned: boolean,
  ): Promise<AssistantConversation> {
    let updated: AssistantConversation | null = null;
    updateAssistantStore((current) => ({
      ...current,
      conversations: current.conversations.map((item) => {
        if (item.id !== id) {
          return item;
        }
        updated = {
          ...item,
          pinned,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (!updated) {
      throw new Error("Conversation not found");
    }
    return updated;
  },

  async setActiveConversation(id: string | null): Promise<void> {
    updateAssistantStore((current) => ({
      ...current,
      activeConversationId: id,
    }));
  },

  async getActiveConversationId(): Promise<string | null> {
    return readAssistantStore().activeConversationId;
  },

  /**
   * Integration point for future AI/MCP backends.
   * Stores the user message, then rejects — no fabricated assistant content.
   */
  async sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse> {
    const content = request.content.trim();
    if (!content) {
      throw new Error("Message cannot be empty");
    }

    const userMessage = createUserMessage(content);
    const systemNotice = createUnavailableSystemMessage();

    updateAssistantStore((current) => ({
      ...current,
      conversations: current.conversations.map((item) => {
        if (item.id !== request.conversationId) {
          return item;
        }
        const title =
          item.messages.length === 0
            ? content.slice(0, 48) || item.title
            : item.title;
        return {
          ...item,
          title,
          updatedAt: new Date().toISOString(),
          messages: [...item.messages, userMessage, systemNotice],
        };
      }),
      activeConversationId: request.conversationId,
    }));

    throw new AssistantNotAvailableError();
  },

  /**
   * Future streaming integration. Currently yields nothing and signals unavailability.
   */
  async *streamMessage(
    _request: SendMessageRequest,
  ): AsyncGenerator<StreamChunk, void, unknown> {
    void _request;
    throw new AssistantNotAvailableError(
      "Streaming is not available. Connect an AI/MCP provider to enable response streaming.",
    );
  },

  /**
   * Future: stop an in-flight generation job.
   */
  async stopGeneration(_conversationId: string): Promise<void> {
    void _conversationId;
    // No-op until a streaming backend exists.
  },

  /**
   * Future: regenerate the last assistant turn.
   */
  async regenerate(_conversationId: string): Promise<never> {
    void _conversationId;
    throw new AssistantNotAvailableError(
      "Regenerate requires a connected Assistant API.",
    );
  },
};
