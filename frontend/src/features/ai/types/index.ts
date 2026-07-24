export type AssistantMessageRole = "user" | "assistant" | "system";

export type AssistantMessageStatus =
  | "complete"
  | "streaming"
  | "stopped"
  | "error"
  | "unavailable";

export interface AssistantMessage {
  id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
  status: AssistantMessageStatus;
}

export interface AssistantConversation {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages: AssistantMessage[];
}

export interface AssistantStoreState {
  conversations: AssistantConversation[];
  activeConversationId: string | null;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface SendMessageResponse {
  conversationId: string;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
}

export interface StreamChunk {
  conversationId: string;
  messageId: string;
  delta: string;
  done: boolean;
}

/** Thrown when the Assistant/MCP backend is not configured. */
export class AssistantNotAvailableError extends Error {
  readonly code = "ASSISTANT_NOT_AVAILABLE" as const;

  constructor(
    message = "AI Assistant API is not configured yet. Integration interface only — no model is connected.",
  ) {
    super(message);
    this.name = "AssistantNotAvailableError";
  }
}

export const SUGGESTED_PROMPTS = [
  {
    id: "nl-search",
    title: "Natural language search",
    prompt: "Find documents related to health insurance in my spaces",
  },
  {
    id: "ask-assets",
    title: "Ask about assets",
    prompt: "Summarize my largest files and where they are stored",
  },
  {
    id: "ask-spaces",
    title: "Ask about spaces",
    prompt: "Which Life Spaces have the most recent activity?",
  },
  {
    id: "storage",
    title: "Storage questions",
    prompt: "How much storage am I using and what is growing fastest?",
  },
  {
    id: "activity",
    title: "Recent activity",
    prompt: "What changed in my workspace this week?",
  },
  {
    id: "summary",
    title: "Workspace summary",
    prompt: "Give me a high-level summary of my NovaCore workspace",
  },
] as const;

export const QUICK_ACTIONS = [
  { id: "search", label: "Search workspace", prompt: "Help me search my spaces and assets" },
  { id: "organize", label: "Organize spaces", prompt: "Suggest how to organize my Life Spaces" },
  { id: "storage", label: "Storage tips", prompt: "How can I reduce storage usage?" },
] as const;
