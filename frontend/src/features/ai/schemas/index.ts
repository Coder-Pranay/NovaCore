import { z } from "zod";

export const promptInputSchema = z.object({
  content: z
    .string()
    .min(1, "Enter a message")
    .max(8000, "Message is too long"),
});

export type PromptInputValues = z.infer<typeof promptInputSchema>;

export const renameConversationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(120, "Title is too long"),
});

export type RenameConversationValues = z.infer<typeof renameConversationSchema>;
