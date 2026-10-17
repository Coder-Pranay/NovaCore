import { z } from "zod";

import { passwordFieldSchema } from "@/features/auth/schemas/password.schema";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(100, "Username must be at most 100 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username may only contain letters, numbers, dots, underscores, or hyphens",
  );

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(100, "First name must be at most 100 characters"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(100, "Last name must be at most 100 characters"),
    username: usernameSchema,
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(255, "Email must be at most 255 characters"),
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
