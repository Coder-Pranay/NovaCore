import { z } from "zod";

export const dashboardSummarySchema = z.object({
  user: z.object({
    firstName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }),
  spaces: z.object({
    totalSpaces: z.number(),
    favoriteSpaces: z.number(),
  }),
  assets: z.object({
    totalAssets: z.number(),
    recentUploads: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        assetType: z.string(),
        mimeType: z.string().nullable(),
        fileSize: z.number().nullable(),
        spaceId: z.string(),
        spaceName: z.string(),
        createdAt: z.string(),
      }),
    ),
  }),
  storage: z.object({
    totalFileCount: z.number(),
    totalBytesUsed: z.number(),
    formattedSize: z.string(),
  }),
  statistics: z.object({
    images: z.number(),
    documents: z.number(),
    videos: z.number(),
    notes: z.number(),
    links: z.number(),
  }),
});
