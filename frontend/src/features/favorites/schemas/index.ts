import { z } from "zod";

export const favoriteEntityTypeSchema = z.enum(["SPACE", "ASSET"]);

export const favoriteFilterSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["ALL", "SPACE", "ASSET", "PINNED", "RECENT"]).default("ALL"),
  sortBy: z
    .enum(["name", "favoritedAt", "entityType", "alphabetical"])
    .default("favoritedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type FavoriteFilterFormValues = z.infer<typeof favoriteFilterSchema>;
