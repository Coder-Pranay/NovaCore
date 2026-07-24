import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /\d/;
const specialCharacterRegex = /[^A-Za-z0-9]/;

export const passwordFieldSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(uppercaseRegex, "Password must include an uppercase letter")
  .regex(lowercaseRegex, "Password must include a lowercase letter")
  .regex(numberRegex, "Password must include a number")
  .regex(specialCharacterRegex, "Password must include a special character");

export function validatePasswordRules(password: string) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: uppercaseRegex.test(password),
    lowercase: lowercaseRegex.test(password),
    number: numberRegex.test(password),
    specialCharacter: specialCharacterRegex.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const rules = validatePasswordRules(password);
  return Object.values(rules).every(Boolean);
}

export const resetPasswordSchema = z
  .object({
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
