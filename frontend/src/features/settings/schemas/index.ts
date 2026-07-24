import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  phoneNumber: z
    .string()
    .max(30)
    .regex(/^$|^[+]?[0-9\s\-().]{7,30}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(2).max(16),
  timezone: z.string().min(1),
  dateFormat: z.enum(["MMM d, yyyy", "dd/MM/yyyy", "yyyy-MM-dd"]),
  numberFormat: z.enum(["en-US", "en-IN", "de-DE"]),
  organizationName: z.string().max(120),
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
  compactMode: z.boolean(),
});

export type PreferencesFormValues = z.infer<typeof preferencesSchema>;
