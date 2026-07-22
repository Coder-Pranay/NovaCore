export const QUERY_KEYS = {
  auth: {
    session: ["auth", "session"] as const,
    profile: ["auth", "profile"] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
    activity: ["dashboard", "activity"] as const,
  },
  spaces: {
    all: ["spaces"] as const,
    detail: (id: string) => ["spaces", id] as const,
  },
  assets: {
    all: ["assets"] as const,
    bySpace: (spaceId: string) => ["assets", "space", spaceId] as const,
    detail: (id: string) => ["assets", id] as const,
  },
  search: {
    results: (query: string, page: number, size: number) =>
      ["search", query, page, size] as const,
  },
} as const;
