"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CropIcon,
  FileIcon,
  UploadCloudIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { ImageCropDialog } from "@/features/assets/components/image-crop-dialog";
import { useUploadAsset } from "@/features/assets/hooks";
import { isImageFile } from "@/features/assets/utils/crop-image";
import {
  addToUploadQueue,
  clearUploadQueue,
  getUploadQueue,
  removeFromUploadQueue,
  replaceInUploadQueue,
  subscribeUploadQueue,
  uploadQueueFileKey,
} from "@/features/assets/utils/upload-queue";
import type { Space } from "@/features/spaces/types";
import { cn } from "@/utils";
import { formatFileSize } from "@/utils/file-size";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

interface UploadAssetFormProps {
  spaces: Space[];
  spacesLoading?: boolean;
  defaultSpaceId?: string;
}

function collectFiles(list: FileList | null | undefined): File[] {
  if (!list || list.length === 0) {
    return [];
  }
  return Array.from(list);
}

function partitionBySize(incoming: File[]): {
  accepted: File[];
  rejectedCount: number;
} {
  const accepted: File[] = [];
  let rejectedCount = 0;
  for (const file of incoming) {
    if (file.size > MAX_UPLOAD_BYTES) {
      rejectedCount += 1;
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejectedCount };
}

export function UploadAssetForm({
  spaces,
  spacesLoading = false,
  defaultSpaceId,
}: UploadAssetFormProps) {
  const spaceSelectId = useId();
  const descriptionId = useId();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const uploadMutation = useUploadAsset();

  const [spaceId, setSpaceId] = useState(defaultSpaceId ?? "");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>(() => getUploadQueue());
  const [dropError, setDropError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  /** Images waiting to be cropped (or skipped) before entering the queue. */
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);
  /** Re-crop an image already in the queue. */
  const [reCropTarget, setReCropTarget] = useState<{
    key: string;
    file: File;
  } | null>(null);

  useEffect(() => subscribeUploadQueue(setFiles), []);

  const activeSpaces = spaces.filter((space) => !space.archived);
  const effectiveSpaceId = spaceId || defaultSpaceId || activeSpaces[0]?.id || "";
  const busy = uploadMutation.isPending;
  const dropDisabled = busy || activeSpaces.length === 0;
  const canUpload =
    files.length > 0 && Boolean(effectiveSpaceId) && !busy && activeSpaces.length > 0;

  const cropFile = pendingCropFiles[0] ?? reCropTarget?.file ?? null;
  const cropOpen = Boolean(cropFile);
  const cropAllowSkip = pendingCropFiles.length > 0;

  const advancePendingCrop = () => {
    setPendingCropFiles((prev) => prev.slice(1));
  };

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) {
      return;
    }

    const { accepted, rejectedCount } = partitionBySize(incoming);

    if (rejectedCount > 0 && accepted.length === 0) {
      setDropError(
        `Files were rejected. Max size is ${formatFileSize(MAX_UPLOAD_BYTES)} per file.`,
      );
      return;
    }

    if (rejectedCount > 0) {
      setDropError(
        `${rejectedCount} file(s) skipped (max ${formatFileSize(MAX_UPLOAD_BYTES)} each).`,
      );
    } else {
      setDropError(null);
    }

    if (accepted.length === 0) {
      return;
    }

    const images = accepted.filter(isImageFile);
    const others = accepted.filter((file) => !isImageFile(file));

    if (others.length > 0) {
      addToUploadQueue(others);
    }

    if (images.length > 0) {
      setPendingCropFiles((prev) => [...prev, ...images]);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const queued = getUploadQueue();
    if (queued.length === 0 || !effectiveSpaceId) {
      return;
    }

    const result = await uploadMutation.mutateAsync({
      files: queued,
      spaceId: effectiveSpaceId,
      description: description.trim() || undefined,
    });

    if (result.failed.length === 0) {
      clearUploadQueue();
      setDescription("");
      setDropError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const failedNames = new Set(result.failed.map((item) => item.name));
    const remaining = getUploadQueue().filter((file) => failedNames.has(file.name));
    clearUploadQueue();
    addToUploadQueue(remaining);
    setDropError(
      result.failed.length === 1
        ? result.failed[0]?.message ?? "Unable to upload file"
        : `${result.failed.length} file(s) failed to upload.`,
    );
  };

  const uploadLabel =
    files.length > 1 ? `Upload ${files.length} files` : "Upload";

  return (
    <>
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="space-y-4 rounded-xl border p-4"
      >
        <div>
          <h2 className="text-sm font-medium">Upload files</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Drop files one by one or several at once. Images open a crop step
            before they join the queue.
          </p>
        </div>

        {activeSpaces.length === 0 && !spacesLoading ? (
          <p className="text-muted-foreground text-sm">
            Create a Space before uploading assets.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={spaceSelectId}>Space</Label>
                <select
                  id={spaceSelectId}
                  className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                  value={effectiveSpaceId}
                  disabled={busy || spacesLoading || activeSpaces.length === 0}
                  onChange={(event) => setSpaceId(event.target.value)}
                >
                  {activeSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={descriptionId}>Description (optional)</Label>
                <Input
                  id={descriptionId}
                  value={description}
                  disabled={busy}
                  placeholder="Short note applied to all files in this upload"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={fileInputId}>Files</Label>

              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                multiple
                className="sr-only"
                disabled={dropDisabled}
                aria-label="Upload files"
                tabIndex={-1}
                onChange={(event) => {
                  addFiles(collectFiles(event.target.files));
                  event.target.value = "";
                }}
              />

              <div
                data-testid="asset-upload-dropzone"
                aria-disabled={dropDisabled}
                aria-describedby={`${fileInputId}-hint`}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40",
                  dropDisabled && "pointer-events-none opacity-60",
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (dropDisabled) {
                    return;
                  }
                  if (!Array.from(event.dataTransfer.types).includes("Files")) {
                    return;
                  }
                  dragDepthRef.current += 1;
                  setIsDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!dropDisabled) {
                    event.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                  if (dragDepthRef.current === 0) {
                    setIsDragActive(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  dragDepthRef.current = 0;
                  setIsDragActive(false);
                  if (dropDisabled) {
                    return;
                  }

                  const fromFiles = collectFiles(event.dataTransfer.files);
                  if (fromFiles.length > 0) {
                    addFiles(fromFiles);
                    return;
                  }

                  const fromItems: File[] = [];
                  for (const item of Array.from(event.dataTransfer.items ?? [])) {
                    if (item.kind === "file") {
                      const dropped = item.getAsFile();
                      if (dropped) {
                        fromItems.push(dropped);
                      }
                    }
                  }
                  addFiles(fromItems);
                }}
              >
                <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
                  <UploadCloudIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragActive
                      ? "Drop to add to queue"
                      : "Drag & drop files here"}
                  </p>
                  <p
                    id={`${fileInputId}-hint`}
                    className="text-muted-foreground text-xs"
                  >
                    Up to {formatFileSize(MAX_UPLOAD_BYTES)} each · images get a
                    crop option · each drop{" "}
                    <span className="text-foreground font-medium">adds</span> to
                    the queue
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse files
                </Button>
              </div>

              {dropError ? (
                <p className="text-destructive text-sm" role="alert">
                  {dropError}
                </p>
              ) : null}

              {pendingCropFiles.length > 1 ? (
                <p className="text-muted-foreground text-xs">
                  {pendingCropFiles.length} images waiting to crop — finish or
                  skip one at a time.
                </p>
              ) : null}

              {files.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm font-medium"
                      data-testid="asset-upload-queue-count"
                    >
                      {files.length} file{files.length === 1 ? "" : "s"} in queue
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        clearUploadQueue();
                        setDropError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Clear all
                    </Button>
                  </div>
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {files.map((file) => {
                      const key = uploadQueueFileKey(file);
                      const image = isImageFile(file);
                      return (
                        <li
                          key={key}
                          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                              <FileIcon className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {file.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatFileSize(file.size)}
                                {file.type ? ` · ${file.type}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {image ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={busy || cropOpen}
                                aria-label={`Crop ${file.name}`}
                                onClick={() =>
                                  setReCropTarget({ key, file })
                                }
                              >
                                <CropIcon
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                <span className="sr-only sm:not-sr-only sm:ml-1">
                                  Crop
                                </span>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              aria-label={`Remove ${file.name}`}
                              onClick={() => {
                                removeFromUploadQueue(key);
                                setDropError(null);
                              }}
                            >
                              <XIcon className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>

            <Button type="submit" disabled={!canUpload}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" label="Uploading files" />
                  Uploading...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <UploadIcon className="size-4" aria-hidden="true" />
                  {uploadLabel}
                </span>
              )}
            </Button>
          </>
        )}
      </form>

      <ImageCropDialog
        file={cropFile}
        open={cropOpen}
        allowSkip={cropAllowSkip}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            return;
          }
          if (pendingCropFiles.length > 0) {
            // Closing without Apply/Skip discards that pending image.
            advancePendingCrop();
            return;
          }
          setReCropTarget(null);
        }}
        onSkip={() => {
          if (pendingCropFiles[0]) {
            addToUploadQueue([pendingCropFiles[0]]);
            advancePendingCrop();
          }
        }}
        onCropped={(cropped) => {
          if (pendingCropFiles.length > 0) {
            addToUploadQueue([cropped]);
            advancePendingCrop();
            return;
          }
          if (reCropTarget) {
            replaceInUploadQueue(reCropTarget.key, cropped);
            setReCropTarget(null);
          }
        }}
      />
    </>
  );
}
