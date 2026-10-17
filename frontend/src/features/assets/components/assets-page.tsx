"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilesIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ROUTES } from "@/constants";
import { assetService } from "@/features/assets/api/asset-service";
import { AssetPreviewDialog } from "@/features/assets/components/asset-preview-dialog";
import {
  AssetsTable,
  AssetsTableSkeleton,
} from "@/features/assets/components/assets-table";
import { UploadAssetForm } from "@/features/assets/components/upload-asset-form";
import { useAssets, useDeleteAsset } from "@/features/assets/hooks";
import type { Asset } from "@/features/assets/types";
import { useAllSpaces } from "@/features/spaces/hooks";
import { useAuth } from "@/hooks/use-auth";
import { cn, getErrorMessage, parseApiError } from "@/utils";

export function AssetsPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("assets:read");
  const canWrite = hasPermission("assets:write");

  const assetsQuery = useAssets();
  const spacesQuery = useAllSpaces();
  const deleteMutation = useDeleteAsset();
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [pendingDownloadId, setPendingDownloadId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const spaceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const space of spacesQuery.data ?? []) {
      map.set(space.id, space.name);
    }
    return map;
  }, [spacesQuery.data]);

  const assets = assetsQuery.data ?? [];
  const isDeleting = deleteMutation.isPending;

  const handleConfirmDelete = async () => {
    if (!assetToDelete) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(assetToDelete.id);
      setAssetToDelete(null);
    } catch {
      // Toast handled by mutation; keep dialog open so the user can retry or cancel.
    }
  };

  const handleDownload = async (asset: Asset) => {
    setPendingDownloadId(asset.id);
    try {
      await assetService.downloadAsset(asset);
      toast.success("Download started");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to download file"));
    } finally {
      setPendingDownloadId(null);
    }
  };

  if (!canRead) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to view assets."
        action={
          <Link
            href={ROUTES.DASHBOARD}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-muted-foreground text-sm">
            Upload, preview, and download files across your Spaces.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={assetsQuery.isFetching}
          onClick={() => void assetsQuery.refetch()}
        >
          <RefreshCwIcon className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {canWrite ? (
        <UploadAssetForm
          key="assets-upload-form"
          spaces={spacesQuery.data ?? []}
          spacesLoading={spacesQuery.isLoading}
        />
      ) : null}

      {assetsQuery.isLoading ? (
        <AssetsTableSkeleton />
      ) : assetsQuery.isError ? (
        <ErrorState
          title={
            parseApiError(assetsQuery.error).status === 401
              ? "Authentication required"
              : "Unable to load assets"
          }
          message={getErrorMessage(assetsQuery.error, "Try refreshing the list.")}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void assetsQuery.refetch()}
            >
              Retry
            </Button>
          }
        />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={FilesIcon}
          title="No assets yet"
          description={
            canWrite
              ? "Upload a file above to add your first asset."
              : "Assets uploaded to your Spaces will appear here."
          }
          action={
            <Link href={ROUTES.SPACES} className={cn(buttonVariants({ variant: "outline" }))}>
              Browse Spaces
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {assets.length} asset{assets.length === 1 ? "" : "s"}
          </p>
          <AssetsTable
            assets={assets}
            spaceNameById={spaceNameById}
            isDeletingId={assetToDelete && isDeleting ? assetToDelete.id : null}
            isDownloadingId={pendingDownloadId}
            onDelete={setAssetToDelete}
            onPreview={setPreviewAsset}
            onDownload={(asset) => {
              void handleDownload(asset);
            }}
          />
        </div>
      )}

      <ConfirmationDialog
        open={Boolean(assetToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setAssetToDelete(null);
          }
        }}
        title="Delete asset?"
        description={
          assetToDelete
            ? `“${assetToDelete.name}” will be archived and removed from your active assets list.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />

      <AssetPreviewDialog
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAsset(null);
          }
        }}
      />
    </div>
  );
}
