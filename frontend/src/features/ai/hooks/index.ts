"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { assistantService } from "@/features/ai/api/assistant-service";
import { AssistantNotAvailableError } from "@/features/ai/types";
import { getErrorMessage } from "@/utils";

function invalidateAssistant(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assistant.all });
  void queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.assistant.conversations,
  });
}

export function useAssistant() {
  return useQuery({
    queryKey: QUERY_KEYS.assistant.conversations,
    queryFn: async () => {
      const [conversations, activeConversationId] = await Promise.all([
        assistantService.listConversations(),
        assistantService.getActiveConversationId(),
      ]);
      return { conversations, activeConversationId };
    },
    staleTime: 10_000,
  });
}

export function useConversation(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.assistant.conversation(id ?? "none"),
    queryFn: () => assistantService.getConversation(id!),
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => assistantService.createConversation(title),
    onSuccess: () => {
      invalidateAssistant(queryClient);
    },
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      assistantService.renameConversation(id, title),
    onSuccess: (conversation) => {
      invalidateAssistant(queryClient);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assistant.conversation(conversation.id),
      });
      toast.success("Conversation renamed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to rename conversation"));
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assistantService.deleteConversation(id),
    onSuccess: () => {
      invalidateAssistant(queryClient);
      toast.success("Conversation deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete conversation"));
    },
  });
}

export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      assistantService.pinConversation(id, pinned),
    onSuccess: () => {
      invalidateAssistant(queryClient);
    },
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => assistantService.sendMessage({ conversationId, content }),
    onSettled: (_data, _error, variables) => {
      invalidateAssistant(queryClient);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assistant.conversation(variables.conversationId),
      });
    },
    onError: (error) => {
      if (error instanceof AssistantNotAvailableError) {
        toast.message("Assistant not connected", {
          description: error.message,
        });
        return;
      }
      toast.error(getErrorMessage(error, "Unable to send message"));
    },
  });
}

export function useStopGeneration() {
  return useMutation({
    mutationFn: (conversationId: string) =>
      assistantService.stopGeneration(conversationId),
  });
}

export function useRegenerateMessage() {
  return useMutation({
    mutationFn: (conversationId: string) =>
      assistantService.regenerate(conversationId),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to regenerate"));
    },
  });
}
