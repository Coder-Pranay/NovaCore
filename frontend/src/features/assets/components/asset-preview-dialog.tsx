"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  assetService,
  isImageAsset,
} from "@/features/assets/api/asset-service";
import type { Asset } from "@/features/assets/types";
import { getErrorMessage } from "@/utils";
import { formatFileSize } from "@/utils/file-size";

interface AssetPreviewDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetPreviewDialog({
  asset,
  open,
  onOpenChange,
}: AssetPreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let revoked = false;
    let createdUrl: string | null = null;

    async function load() {
      if (!open || !asset?.contentAvailable || !isImageAsset(asset)) {
        setObjectUrl(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const blob = await assetService.getContentBlob(asset.id, false);
        if (revoked) {
          return;
        }
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch (err) {
        if (!revoked) {
          setError(getErrorMessage(err, "Unable to load file preview"));
        }
      } finally {
        if (!revoked) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      revoked = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, asset]);

  const handleDownload = async () => {
    if (!asset) {
      return;
    }
    setDownloading(true);
    try {
      await assetService.downloadAsset(asset);
      toast.success("Download started");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to download file"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {asset?.name ?? "Asset"}
          </DialogTitle>
          <DialogDescription>
            {asset
              ? `${asset.mimeType || "Unknown type"} · ${formatFileSize(asset.fileSize)}`
              : "File preview"}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border">
          {loading ? (
            <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
              Loading preview...
            </span>
          ) : error ? (
            <p className="text-destructive px-4 text-center text-sm">{error}</p>
          ) : asset && isImageAsset(asset) && objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
            <img
              src={objectUrl}
              alt={asset.name}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : asset?.contentAvailable ? (
            <div className="space-y-3 px-4 py-8 text-center">
              <p className="text-sm">
                Preview isn&apos;t available for this file type. You can download
                it instead.
              </p>
              <Button
                type="button"
                onClick={() => {
                  void handleDownload();
                }}
                disabled={downloading}
              >
                <DownloadIcon className="size-4" aria-hidden="true" />
                {downloading ? "Downloading..." : "Download file"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No file available.</p>
          )}
        </div>

        {asset?.contentAvailable ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleDownload();
              }}
              disabled={downloading}
            >
              <DownloadIcon className="size-4" aria-hidden="true" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
