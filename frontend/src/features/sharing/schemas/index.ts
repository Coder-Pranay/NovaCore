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

export const publicLinkSchema = z
  .object({
    expiresAt: z.string().optional().or(z.literal("")),
    passwordProtected: z.boolean(),
    password: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (!values.passwordProtected) {
      return;
    }
    const password = values.password?.trim() ?? "";
    if (password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at least 8 characters",
      });
    }
    if (password.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at most 100 characters",
      });
    }
  });

export const sharePasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type ShareInviteFormValues = z.infer<typeof shareInviteSchema>;
export type PublicLinkFormValues = z.infer<typeof publicLinkSchema>;
export type SharePasswordFormValues = z.infer<typeof sharePasswordSchema>;
