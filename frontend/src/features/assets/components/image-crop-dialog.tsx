"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CropIcon, LoaderCircleIcon } from "lucide-react";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCroppedImageFile } from "@/features/assets/utils/crop-image";
import { cn } from "@/utils";
import { formatFileSize } from "@/utils/file-size";

const ASPECT_OPTIONS = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
] as const;

interface ImageCropDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  /** When true, show "Use original" so the user can skip cropping. */
  allowSkip?: boolean;
  onSkip?: () => void;
}

export function ImageCropDialog({
  file,
  open,
  onOpenChange,
  onCropped,
  allowSkip = false,
  onSkip,
}: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !file) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(undefined);
      setCroppedAreaPixels(null);
      setError(null);
      setApplying(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(undefined);
    setCroppedAreaPixels(null);
    setError(null);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!file || !imageSrc || !croppedAreaPixels) {
      return;
    }

    setApplying(true);
    setError(null);
    try {
      const cropped = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        file.name,
        file.type || "image/jpeg",
      );
      // Parent clears/advances state; that closes the dialog.
      onCropped(cropped);
    } catch {
      setError("Unable to crop this image. Try a different area.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <CropIcon className="size-4 shrink-0" aria-hidden="true" />
            Crop image
          </DialogTitle>
          <DialogDescription className="truncate">
            {file
              ? `${file.name} · ${formatFileSize(file.size)}`
              : "Adjust the crop area before uploading"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative h-[320px] w-full overflow-hidden rounded-lg bg-black sm:h-[400px]">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Loading image...
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="crop-zoom">Zoom</Label>
              <input
                id="crop-zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={!imageSrc || applying}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-primary"
                aria-label="Zoom"
              />
            </div>

            <div className="space-y-2">
              <Label>Aspect ratio</Label>
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_OPTIONS.map((option) => {
                  const selected = aspect === option.value;
                  return (
                    <Button
                      key={option.label}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      disabled={!imageSrc || applying}
                      className={cn("min-w-12", selected && "pointer-events-none")}
                      onClick={() => setAspect(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          {allowSkip ? (
            <Button
              type="button"
              variant="ghost"
              disabled={applying}
              onClick={() => {
                // Parent advances pending queue; that closes/moves to next.
                onSkip?.();
              }}
            >
              Use original
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={applying}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            disabled={!imageSrc || !croppedAreaPixels || applying}
            onClick={() => {
              void handleApply();
            }}
          >
            {applying ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircleIcon
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Applying...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CropIcon className="size-4" aria-hidden="true" />
                Apply crop
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
