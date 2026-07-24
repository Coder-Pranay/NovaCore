# AI Assistant

Sprint 9.12 — assistant UI and integration interfaces for NovaCore.

## Architecture

```
features/ai/
  api/assistant-service.ts
  api/assistant-store.ts
  hooks/
  components/
  chat/
  prompts/
  schemas/
  types/
  utils/
  README.md
```

Route: `/ai`

## Critical policy

- **No AI model is implemented**
- **No fabricated assistant answers**
- Conversation chrome (list, rename, pin, delete, user messages) may persist locally
- `assistantService.sendMessage` / `streamMessage` / `regenerate` throw `AssistantNotAvailableError`
- After a user send, a **system status** message explains the backend is not connected

## Future backend dependencies

| Method | Path (proposed) | Purpose |
|--------|-----------------|---------|
| GET | `/v1/ai/conversations` | List conversations |
| POST | `/v1/ai/conversations` | Create conversation |
| POST | `/v1/ai/chat` | Send message |
| POST | `/v1/ai/chat/stream` | SSE/WebSocket streaming |
| POST | `/v1/ai/chat/stop` | Stop generation |
| POST | `/v1/ai/chat/regenerate` | Regenerate last turn |

MCP: tools for Spaces, Assets, Search, Analytics should plug into `streamMessage`.

## UI features

- Conversation list (pin / rename / delete)
- Chat window + prompt input
- Suggested prompts & quick actions (fill composer only)
- Typing indicator + stop control
- Markdown-ish rendering (paragraphs + fenced code)
- Copy / regenerate actions
- Empty states

## Hooks

- `useAssistant`
- `useConversation`
- `useSendAssistantMessage`
- `useCreateConversation` / rename / delete / pin
- `useStopGeneration` / `useRegenerateMessage`

Query keys: `QUERY_KEYS.assistant.*`
