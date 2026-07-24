"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { searchService } from "@/features/search/api/search-service";

export function useSearchResults(query: string, page = 0, size = 20) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: QUERY_KEYS.search.results(trimmed, page, size),
    queryFn: () => searchService.search({ q: trimmed, page, size }),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}
