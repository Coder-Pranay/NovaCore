export const SUGGESTED_COMMANDS = [
  "/search <query> — Natural language search (future)",
  "/spaces — Ask about Life Spaces (future)",
  "/assets — Ask about files and assets (future)",
  "/storage — Storage analytics questions (future)",
  "/activity — Recent activity questions (future)",
  "/summary — Workspace summary (future)",
] as const;

export const MCP_INTEGRATION_NOTES = [
  "Future MCP tools can expose Spaces, Assets, Search, and Analytics.",
  "assistantService.streamMessage is the streaming integration point.",
  "Do not invent model responses in the client.",
] as const;
