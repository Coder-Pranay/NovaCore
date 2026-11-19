"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import { assetService } from "@/features/assets/api/asset-service";
import type {
  GenerateAssetPayload,
  UploadAssetPayload,
  UploadAssetsPayload,
  UploadAssetsResult,
} from "@/features/assets/types";
import { getErrorMessage } from "@/utils";

function invalidateAssetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all });
  void queryClient.invalidateQueries({ queryKey: ["assets"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.summary });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.recentAssets });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.all });
  void queryClient.invalidateQueries({ queryKey: ["spaces", "list"] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spaces.all });
}

export function useAssets(spaceId?: string) {
  return useQuery({
    queryKey: spaceId
      ? QUERY_KEYS.assets.bySpace(spaceId)
      : QUERY_KEYS.assets.all,
    queryFn: () => assetService.getAssets(spaceId),
    staleTime: 30_000,
  });
}

async function uploadAssetsSequentially(
  payload: UploadAssetsPayload,
): Promise<UploadAssetsResult> {
  const failed: UploadAssetsResult["failed"] = [];
  let succeeded = 0;

  for (const file of payload.files) {
    try {
      await assetService.uploadAsset({
        file,
        spaceId: payload.spaceId,
        description: payload.description,
      });
      succeeded += 1;
    } catch (error) {
      failed.push({
        name: file.name,
        message: getErrorMessage(error, "Unable to upload file"),
      });
    }
  }

  return { succeeded, failed };
}

export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadAssetPayload | UploadAssetsPayload) => {
      if ("files" in payload && Array.isArray(payload.files)) {
        return uploadAssetsSequentially(payload);
      }
      return assetService.uploadAsset(payload).then(() => ({
        succeeded: 1,
        failed: [] as UploadAssetsResult["failed"],
      }));
    },
    onSuccess: (result) => {
      if (result.succeeded > 0) {
        invalidateAssetQueries(queryClient);
      }

      if (result.failed.length === 0) {
        toast.success(
          result.succeeded === 1
            ? "File uploaded successfully"
            : `${result.succeeded} files uploaded successfully`,
        );
        return;
      }

      if (result.succeeded === 0) {
        toast.error(
          result.failed.length === 1
            ? result.failed[0]?.message ?? "Unable to upload file"
            : `Unable to upload ${result.failed.length} files`,
        );
        return;
      }

      toast.warning(
        `${result.succeeded} uploaded, ${result.failed.length} failed`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to upload file"));
    },
  });
}

export function useImageGenStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.assets.generateStatus,
    queryFn: () => assetService.getImageGenStatus(),
    staleTime: 2_000,
    refetchInterval: (query) => (query.state.data?.busy ? 2_000 : 10_000),
    retry: 1,
  });
}

export function useGenerateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateAssetPayload) =>
      assetService.generateAsset(payload),
    onSuccess: () => {
      invalidateAssetQueries(queryClient);
      toast.success("Image generated and saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to generate image"));
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      invalidateAssetQueries(queryClient);
      toast.success("Asset deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete asset"));
    },
  });
}
