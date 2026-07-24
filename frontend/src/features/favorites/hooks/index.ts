"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { favoriteService } from "@/features/favorites/api/favorite-service";
import type {
  FavoriteItem,
  FavoriteListParams,
  FavoriteTarget,
} from "@/features/favorites/types";
import { getErrorMessage } from "@/utils";

function invalidateFavoriteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.all });
  void queryClient.invalidateQueries({ queryKey: ["favorites", "list"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spaces.all });
  void queryClient.invalidateQueries({ queryKey: ["spaces", "list"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.summary });
}

export function useFavorites(params: FavoriteListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.favorites.list(params as Record<string, unknown>),
    queryFn: () => favoriteService.getFavorites(params),
    staleTime: 30_000,
  });
}

export function useFavorite() {
  return useMutation({
    mutationFn: (target: FavoriteTarget) =>
      target.favorite
        ? favoriteService.favorite(target)
        : favoriteService.unfavorite(target),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: FavoriteItem) => {
      if (item.entityType === "SPACE" && item.rawSpace) {
        return favoriteService.unfavorite({
          entityType: "SPACE",
          entityId: item.entityId,
          favorite: false,
          space: item.rawSpace,
        });
      }
      if (item.entityType === "ASSET" && item.rawAsset) {
        return favoriteService.unfavorite({
          entityType: "ASSET",
          entityId: item.entityId,
          favorite: false,
          asset: item.rawAsset,
        });
      }
      throw new Error("Missing entity payload for favorite toggle.");
    },
    onSuccess: () => {
      invalidateFavoriteQueries(queryClient);
      toast.success("Removed from favorites");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update favorite"));
    },
  });
}

export function useFavoriteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: FavoriteTarget) =>
      target.favorite
        ? favoriteService.favorite(target)
        : favoriteService.unfavorite(target),
    onSuccess: (_data, variables) => {
      invalidateFavoriteQueries(queryClient);
      toast.success(
        variables.favorite ? "Added to favorites" : "Removed from favorites",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update favorite"));
    },
  });
}

export function useBulkFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targets,
      favorite,
    }: {
      targets: FavoriteTarget[];
      favorite: boolean;
    }) => {
      if (favorite) {
        return favoriteService.bulkFavorite(targets);
      }
      await favoriteService.bulkUnfavorite(targets);
      return [];
    },
    onSuccess: (_data, variables) => {
      invalidateFavoriteQueries(queryClient);
      toast.success(
        variables.favorite
          ? "Selected items favorited"
          : "Selected items removed from favorites",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update favorites"));
    },
  });
}

export function useToggleFavoritePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => favoriteService.togglePin(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.all });
      void queryClient.invalidateQueries({ queryKey: ["favorites", "list"] });
    },
  });
}
