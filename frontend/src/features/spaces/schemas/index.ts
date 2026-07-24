import { z } from "zod";

import { SPACE_TYPES } from "@/features/spaces/types";

export const spaceTypeSchema = z.enum([
  "HOME",
  "FAMILY",
  "WORK",
  "PROJECT",
  "TRAVEL",
  "HEALTH",
  "FINANCE",
  "VEHICLE",
  "EDUCATION",
  "COLLECTION",
  "BLANK",
]);

export const createSpaceSchema = z.object({
  name: z
    .string()
    .min(1, "Space name is required")
    .max(100, "Name must be 100 characters or less"),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, {
      message: "Use lowercase letters, numbers, and hyphens only",
    })
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^$|^#?[0-9A-Fa-f]{3,8}$/, "Enter a valid hex color")
    .optional()
    .or(z.literal("")),
  type: spaceTypeSchema,
});

export const updateSpaceSchema = z.object({
  name: z
    .string()
    .min(1, "Space name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^$|^#?[0-9A-Fa-f]{3,8}$/, "Enter a valid hex color")
    .optional()
    .or(z.literal("")),
  type: spaceTypeSchema,
});

export type CreateSpaceFormValues = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceFormValues = z.infer<typeof updateSpaceSchema>;

export const SPACE_TYPE_OPTIONS = SPACE_TYPES.map((type) => ({
  value: type,
  label: type.charAt(0) + type.slice(1).toLowerCase(),
}));
