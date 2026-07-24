import { z } from "zod";

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, "Email or username is required")
    .max(255, "Email or username is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
