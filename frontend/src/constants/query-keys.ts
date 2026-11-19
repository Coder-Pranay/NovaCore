export const QUERY_KEYS = {
  auth: {
    session: ["auth", "session"] as const,
    profile: ["auth", "profile"] as const,
    currentUser: ["auth", "current-user"] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    summary: ["dashboard", "summary"] as const,
    dashboardSummary: ["dashboard", "summary"] as const,
    storage: ["dashboard", "storage"] as const,
    recentAssets: ["dashboard", "recent-assets"] as const,
    recentSpaces: ["dashboard", "recent-spaces"] as const,
    activity: ["dashboard", "activity"] as const,
  },
  spaces: {
    all: ["spaces"] as const,
    list: (params?: Record<string, unknown>) => ["spaces", "list", params ?? {}] as const,
    detail: (id: string) => ["spaces", id] as const,
    search: (query: string) => ["spaces", "search", query] as const,
    members: (id: string) => ["spaces", id, "members"] as const,
    statistics: (id: string) => ["spaces", id, "statistics"] as const,
  },
  assets: {
    all: ["assets"] as const,
    bySpace: (spaceId: string) => ["assets", "space", spaceId] as const,
    detail: (id: string) => ["assets", id] as const,
    generateStatus: ["assets", "generate-status"] as const,
  },
  search: {
    results: (query: string, page: number, size: number) =>
      ["search", query, page, size] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    list: (params?: Record<string, unknown>) =>
      ["favorites", "list", params ?? {}] as const,
    assets: ["favorites", "assets"] as const,
    spaces: ["favorites", "spaces"] as const,
  },
  sharing: {
    all: ["sharing"] as const,
    sharedItems: (params?: Record<string, unknown>) =>
      ["sharing", "items", params ?? {}] as const,
    permissions: (resourceType: string, resourceId: string) =>
      ["sharing", "permissions", resourceType, resourceId] as const,
    publicLinks: (resourceType?: string, resourceId?: string) =>
      ["sharing", "public-links", resourceType ?? "all", resourceId ?? "all"] as const,
    users: (resourceType: string, resourceId: string) =>
      ["sharing", "users", resourceType, resourceId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) =>
      ["notifications", "list", params ?? {}] as const,
    count: ["notifications", "count"] as const,
    preferences: ["notifications", "preferences"] as const,
  },
  analytics: {
    storageAnalytics: ["analytics", "storage"] as const,
    storageTrend: (range?: string) => ["analytics", "storage-trend", range ?? "30d"] as const,
    largestFiles: (range?: string) => ["analytics", "largest-files", range ?? "30d"] as const,
    largestSpaces: (range?: string) => ["analytics", "largest-spaces", range ?? "30d"] as const,
    uploadTrend: (range?: string) => ["analytics", "upload-trend", range ?? "30d"] as const,
  },
  profile: {
    all: ["profile"] as const,
    detail: ["profile", "me"] as const,
  },
  preferences: {
    all: ["preferences"] as const,
  },
  assistant: {
    all: ["assistant"] as const,
    conversations: ["assistant", "conversations"] as const,
    conversation: (id: string) => ["assistant", "conversation", id] as const,
  },
} as const;
