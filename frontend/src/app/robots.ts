import type { MetadataRoute } from "next";

import { APP_URL } from "@/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/unauthorized"],
      disallow: [
        "/dashboard",
        "/spaces",
        "/assets",
        "/favorites",
        "/shared",
        "/notifications",
        "/analytics",
        "/storage",
        "/settings",
        "/profile",
        "/ai",
        "/search",
        "/api",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
