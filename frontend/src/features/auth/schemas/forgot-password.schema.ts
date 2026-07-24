import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
