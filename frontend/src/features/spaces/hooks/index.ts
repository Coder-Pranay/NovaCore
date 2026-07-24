"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { spaceService } from "@/features/spaces/api/space-service";
import type {
  CreateSpacePayload,
  Space,
  SpaceListParams,
  UpdateSpacePayload,
} from "@/features/spaces/types";
import { filterAndPaginateSpaces } from "@/features/spaces/utils";
import { getErrorMessage } from "@/utils";

export function useSpaces(params: SpaceListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.spaces.list(params as Record<string, unknown>),
    queryFn: async () => {
      const spaces = await spaceService.getSpaces();
      return filterAndPaginateSpaces(spaces, params);
    },
    staleTime: 30_000,
  });
}

export function useAllSpaces() {
  return useQuery({
    queryKey: QUERY_KEYS.spaces.all,
    queryFn: () => spaceService.getSpaces(),
    staleTime: 30_000,
  });
}

export function useSpace(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.spaces.detail(id ?? ""),
    queryFn: () => spaceService.getSpaceById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useSpaceStatistics(spaceId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.spaces.statistics(spaceId ?? ""),
    queryFn: () => spaceService.getSpaceStatistics(spaceId!),
    enabled: Boolean(spaceId),
    staleTime: 30_000,
  });
}

function invalidateSpaceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spaces.all });
  void queryClient.invalidateQueries({ queryKey: ["spaces", "list"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.summary });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSpacePayload) => spaceService.createSpace(payload),
    onSuccess: () => {
      invalidateSpaceQueries(queryClient);
      toast.success("Space created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create space"));
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSpacePayload }) =>
      spaceService.updateSpace(id, payload),
    onSuccess: (space) => {
      invalidateSpaceQueries(queryClient);
      queryClient.setQueryData(QUERY_KEYS.spaces.detail(space.id), space);
      toast.success("Space updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update space"));
    },
  });
}

export function useArchiveSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => spaceService.archiveSpace(id),
    onSuccess: (space) => {
      invalidateSpaceQueries(queryClient);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.spaces.detail(space.id) });
      toast.success("Space archived successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to archive space"));
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => spaceService.deleteSpace(id),
    onSuccess: (space) => {
      invalidateSpaceQueries(queryClient);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.spaces.detail(space.id) });
      toast.success("Space deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete space"));
    },
  });
}

export function useRestoreSpace() {
  return useMutation({
    mutationFn: (id: string) => spaceService.restoreSpace(id),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to restore space"));
    },
  });
}

export function useFavoriteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ space, favorite }: { space: Space; favorite: boolean }) =>
      spaceService.favoriteSpace(space, favorite),
    onMutate: async ({ space, favorite }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.spaces.all });
      const previous = queryClient.getQueryData<Space[]>(QUERY_KEYS.spaces.all);

      if (previous) {
        queryClient.setQueryData<Space[]>(
          QUERY_KEYS.spaces.all,
          previous.map((item) =>
            item.id === space.id ? { ...item, favorite } : item,
          ),
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.spaces.all, context.previous);
      }
      toast.error(getErrorMessage(error, "Unable to update favorite"));
    },
    onSuccess: (space, variables) => {
      invalidateSpaceQueries(queryClient);
      queryClient.setQueryData(QUERY_KEYS.spaces.detail(space.id), space);
      toast.success(variables.favorite ? "Added to favorites" : "Removed from favorites");
    },
  });
}

export function useBulkArchiveSpaces() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results: Space[] = [];
      for (const id of ids) {
        results.push(await spaceService.archiveSpace(id));
      }
      return results;
    },
    onSuccess: (results) => {
      invalidateSpaceQueries(queryClient);
      toast.success(
        results.length === 1
          ? "Space archived successfully"
          : `${results.length} spaces archived successfully`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to archive selected spaces"));
    },
  });
}

export function useBulkFavoriteSpaces() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaces,
      favorite,
    }: {
      spaces: Space[];
      favorite: boolean;
    }) => {
      const results: Space[] = [];
      for (const space of spaces) {
        results.push(await spaceService.favoriteSpace(space, favorite));
      }
      return results;
    },
    onSuccess: (_results, variables) => {
      invalidateSpaceQueries(queryClient);
      toast.success(
        variables.favorite
          ? "Selected spaces added to favorites"
          : "Selected spaces removed from favorites",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update favorites"));
    },
  });
}
