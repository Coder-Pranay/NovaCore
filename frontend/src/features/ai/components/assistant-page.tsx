"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  CopyIcon,
  MoreHorizontalIcon,
  PinIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAssistant,
  useCreateConversation,
  useDeleteConversation,
  usePinConversation,
  useRegenerateMessage,
  useRenameConversation,
  useSendAssistantMessage,
  useStopGeneration,
} from "@/features/ai/hooks";
import { SUGGESTED_COMMANDS } from "@/features/ai/prompts";
import {
  QUICK_ACTIONS,
  SUGGESTED_PROMPTS,
  type AssistantConversation,
  type AssistantMessage,
} from "@/features/ai/types";
import { conversationPreview } from "@/features/ai/utils";
import { formatRelativeTime, cn } from "@/utils";

export function AssistantPage() {
  const assistantQuery = useAssistant();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useRenameConversation();
  const pinConversation = usePinConversation();
  const sendMessage = useSendAssistantMessage();
  const stopGeneration = useStopGeneration();
  const regenerate = useRegenerateMessage();

  const conversations = useMemo(
    () => assistantQuery.data?.conversations ?? [],
    [assistantQuery.data?.conversations],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeId =
    selectedId ??
    assistantQuery.data?.activeConversationId ??
    conversations[0]?.id ??
    null;

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [activeId, conversations],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length, isTyping]);

  const ensureConversation = async () => {
    if (activeConversation) {
      return activeConversation.id;
    }
    const created = await createConversation.mutateAsync("New conversation");
    setSelectedId(created.id);
    return created.id;
  };

  const handleSend = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sendMessage.isPending) {
      return;
    }
    setDraft("");
    setIsTyping(true);
    try {
      const conversationId = await ensureConversation();
      await sendMessage.mutateAsync({ conversationId, content: trimmed });
    } catch {
      // Availability errors are toasted in the mutation; local history still updates.
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-6xl flex-col gap-4 lg:flex-row">
      <aside className="bg-card flex w-full flex-col rounded-xl border lg:w-72">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <h1 className="text-sm font-semibold">Assistant</h1>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              void createConversation.mutateAsync("New conversation").then((created) => {
                setSelectedId(created.id);
              });
            }}
          >
            <PlusIcon className="size-4" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {assistantQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={SparklesIcon}
              title="No conversations"
              description="Start a chat to prepare for future AI/MCP integration."
              className="py-8"
            />
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={setSelectedId}
              onRename={(id, title) =>
                void renameConversation.mutateAsync({ id, title })
              }
              onDelete={(id) => {
                void deleteConversation.mutateAsync(id).then(() => {
                  if (selectedId === id) {
                    setSelectedId(null);
                  }
                });
              }}
              onPin={(id, pinned) =>
                void pinConversation.mutateAsync({ id, pinned })
              }
            />
          )}
        </div>
      </aside>

      <section className="bg-card flex min-w-0 flex-1 flex-col rounded-xl border">
        <header className="border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {activeConversation?.title ?? "NovaCore Assistant"}
              </h2>
              <p className="text-muted-foreground text-xs">
                UI + integration interfaces only — no model is connected.
              </p>
            </div>
            <Badge variant="outline">MCP ready</Badge>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                icon={SparklesIcon}
                title="Ask about your workspace"
                description="Suggested prompts fill the composer. Responses require a future Assistant API."
                className="py-6"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="hover:bg-muted/50 rounded-lg border p-3 text-left transition-colors"
                    onClick={() => setDraft(item.prompt)}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDraft(action.prompt)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              <div className="bg-muted/40 rounded-lg border p-3 text-xs">
                <p className="font-medium">Suggested commands</p>
                <ul className="text-muted-foreground mt-2 space-y-1">
                  {SUGGESTED_COMMANDS.map((command) => (
                    <li key={command}>{command}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            activeConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={() => void navigator.clipboard.writeText(message.content)}
                onRegenerate={() =>
                  void regenerate.mutateAsync(activeConversation.id)
                }
              />
            ))
          )}

          {isTyping ? (
            <div
              className="text-muted-foreground flex items-center gap-2 text-sm"
              aria-live="polite"
            >
              <span className="bg-muted inline-flex gap-1 rounded-full px-3 py-2">
                <span className="bg-foreground/50 size-1.5 animate-pulse rounded-full" />
                <span className="bg-foreground/50 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
                <span className="bg-foreground/50 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
              </span>
              Connecting to assistant…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <footer className="border-t p-3">
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(draft);
            }}
          >
            <LabelSrOnly htmlFor="assistant-input">Message</LabelSrOnly>
            <Textarea
              id="assistant-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about spaces, assets, storage, or activity…"
              rows={3}
              aria-label="Assistant prompt"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend(draft);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                Enter to send · Shift+Enter for newline
              </p>
              <div className="flex gap-2">
                {isTyping ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (activeId) {
                        void stopGeneration.mutateAsync(activeId);
                      }
                      setIsTyping(false);
                    }}
                  >
                    <SquareIcon className="size-3.5" />
                    Stop
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!draft.trim() || sendMessage.isPending}
                >
                  <SendIcon className="size-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </footer>
      </section>
    </div>
  );
}

const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: {
  conversations: AssistantConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  return (
    <ul className="space-y-1">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <li key={conversation.id}>
            <div
              className={cn(
                "group flex items-start gap-1 rounded-lg border border-transparent p-2",
                active && "bg-muted border-border",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(conversation.id)}
              >
                <div className="flex items-center gap-1">
                  {conversation.pinned ? (
                    <PinIcon className="size-3 shrink-0" aria-hidden="true" />
                  ) : null}
                  <p className="truncate text-sm font-medium">
                    {conversation.title}
                  </p>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {conversationPreview(conversation)}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {formatRelativeTime(conversation.updatedAt)}
                </p>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${conversation.title}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                  )}
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      const title = window.prompt(
                        "Rename conversation",
                        conversation.title,
                      );
                      if (title?.trim()) {
                        onRename(conversation.id, title.trim());
                      }
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onPin(conversation.id, !conversation.pinned)
                    }
                  >
                    <PinIcon className="size-4" />
                    {conversation.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(conversation.id)}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
}: {
  message: AssistantMessage;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "max-w-[90%] rounded-xl border px-3 py-2 sm:max-w-[75%]",
        isUser ? "bg-primary/10 ml-auto" : "bg-muted/40",
        message.status === "unavailable" && "border-dashed",
      )}
      aria-label={`${message.role} message`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px]">
          {message.role}
        </Badge>
        <span className="text-muted-foreground text-[11px]">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
      <MessageContent content={message.content} />
      <div className="mt-2 flex gap-1">
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Copy" onClick={onCopy}>
          <CopyIcon className="size-3.5" />
        </Button>
        {!isUser ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Regenerate"
            onClick={onRegenerate}
          >
            <RefreshCwIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function MessageContent({ content }: { content: string }) {
  const blocks = content.split(/```/);

  return (
    <div className="space-y-2 text-sm leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          return (
            <pre
              key={index}
              className="bg-background overflow-x-auto rounded-lg border p-3 text-xs"
            >
              <code>{block.replace(/^\w+\n/, "")}</code>
            </pre>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

function LabelSrOnly({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="sr-only">
      {children}
    </label>
  );
}
