import type { MetadataRoute } from "next";

import { APP_URL, ROUTES } from "@/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.UNAUTHORIZED] as const;

  return publicPaths.map((path) => ({
    url: `${APP_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === ROUTES.HOME ? "weekly" : "monthly",
    priority: path === ROUTES.HOME ? 1 : 0.6,
  }));
}
