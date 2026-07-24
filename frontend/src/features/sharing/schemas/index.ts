import { z } from "zod";

export const sharePermissionSchema = z.enum([
  "VIEWER",
  "COMMENTER",
  "EDITOR",
  "OWNER",
]);

export const shareInviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  permission: sharePermissionSchema,
  expiresAt: z.string().optional().or(z.literal("")),
});

export const publicLinkSchema = z.object({
  expiresAt: z.string().optional().or(z.literal("")),
  passwordProtected: z.boolean(),
  password: z.string().optional().or(z.literal("")),
});

export type ShareInviteFormValues = z.infer<typeof shareInviteSchema>;
export type PublicLinkFormValues = z.infer<typeof publicLinkSchema>;
