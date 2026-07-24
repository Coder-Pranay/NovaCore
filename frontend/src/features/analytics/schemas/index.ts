import { z } from "zod";

export const analyticsRangeSchema = z.enum([
  "today",
  "7d",
  "30d",
  "90d",
  "year",
  "custom",
]);

export type AnalyticsRangeFormValue = z.infer<typeof analyticsRangeSchema>;
