import { apiClient } from "@/services/api/client";
import type { ApiResponse } from "@/types";
import type { SearchParams, SearchResponse } from "@/features/search/types";

const SEARCH_PATH = "/v1/search";

export const searchService = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const response = await apiClient.get<ApiResponse<SearchResponse>>(SEARCH_PATH, {
      params: {
        q: params.q,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return response.data.data;
  },
};
