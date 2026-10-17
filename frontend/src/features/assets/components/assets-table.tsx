"use client";

import {
  DownloadIcon,
  EyeIcon,
  FileIcon,
  ImageIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  canViewAssetContent,
  isImageAsset,
} from "@/features/assets/api/asset-service";
import type { Asset } from "@/features/assets/types";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file-size";

interface AssetsTableProps {
  assets: Asset[];
  spaceNameById: Map<string, string>;
  isDeletingId?: string | null;
  isDownloadingId?: string | null;
  onDelete: (asset: Asset) => void;
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
}

export function AssetsTable({
  assets,
  spaceNameById,
  isDeletingId,
  isDownloadingId,
  onDelete,
  onPreview,
  onDownload,
}: AssetsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">MIME Type</th>
            <th className="px-4 py-3 font-medium">Upload Date</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {assets.map((asset) => {
            const deleting = isDeletingId === asset.id;
            const downloading = isDownloadingId === asset.id;
            const hasFile = canViewAssetContent(asset);
            const Icon = isImageAsset(asset) ? ImageIcon : FileIcon;

            return (
              <tr key={asset.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{asset.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {spaceNameById.get(asset.spaceId) ?? "Unknown space"}
                        {asset.assetType ? ` · ${asset.assetType}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground whitespace-nowrap px-4 py-3">
                  {formatFileSize(asset.fileSize)}
                </td>
                <td className="text-muted-foreground max-w-[180px] truncate px-4 py-3">
                  {asset.mimeType || "—"}
                </td>
                <td className="text-muted-foreground whitespace-nowrap px-4 py-3">
                  {formatDate(asset.createdAt, "MMM d, yyyy p")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!hasFile || deleting}
                      aria-label={`View ${asset.name}`}
                      onClick={() => onPreview(asset)}
                    >
                      <EyeIcon className="size-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">
                        View
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!hasFile || downloading || deleting}
                      aria-label={`Download ${asset.name}`}
                      onClick={() => onDownload(asset)}
                    >
                      <DownloadIcon className="size-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">
                        {downloading ? "..." : "Download"}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={deleting}
                      aria-label={`Delete ${asset.name}`}
                      onClick={() => onDelete(asset)}
                    >
                      <Trash2Icon className="size-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only sm:ml-1.5">
                        {deleting ? "Deleting..." : "Delete"}
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AssetsTableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
