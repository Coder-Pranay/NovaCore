"use client";

import { useEffect, useId, useState } from "react";
import { CircleCheckIcon, SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { assetService } from "@/features/assets/api/asset-service";
import {
  useGenerateAsset,
  useImageGenStatus,
} from "@/features/assets/hooks";
import type { Asset } from "@/features/assets/types";
import type { Space } from "@/features/spaces/types";

const DEFAULT_PROMPT =
  "moss_xvstyle, a realistic adult photograph of a woman in a softly lit indoor setting, natural skin texture, close photographic composition";

interface GenerateImageFormProps {
  spaces: Space[];
  spacesLoading?: boolean;
  defaultSpaceId?: string;
  referenceFile?: File | null;
  onClearReference?: () => void;
}

export function GenerateImageForm({
  spaces,
  spacesLoading = false,
  defaultSpaceId,
  referenceFile = null,
  onClearReference,
}: GenerateImageFormProps) {
  const spaceSelectId = useId();
  const promptId = useId();
  const confirmId = useId();
  const generateMutation = useGenerateAsset();
  const statusQuery = useImageGenStatus();

  const [spaceId, setSpaceId] = useState(defaultSpaceId ?? "");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Asset | null>(null);
  const [savedPreviewUrl, setSavedPreviewUrl] = useState<string | null>(null);

  const activeSpaces = spaces.filter((space) => !space.archived);
  const effectiveSpaceId = spaceId || defaultSpaceId || activeSpaces[0]?.id || "";
  const status = statusQuery.data;
  const busy = generateMutation.isPending || Boolean(status?.busy);
  const percent = Math.min(100, Math.max(0, status?.percent ?? 0));
  const step = status?.step ?? 0;
  const steps = status?.steps ?? 0;
  const etaLabel = formatEta(status?.etaSeconds);

  useEffect(() => {
    if (!referenceFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(referenceFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceFile]);

  useEffect(() => {
    return () => {
      if (savedPreviewUrl) {
        URL.revokeObjectURL(savedPreviewUrl);
      }
    };
  }, [savedPreviewUrl]);

  const canGenerate =
    Boolean(effectiveSpaceId) &&
    prompt.trim().length > 0 &&
    adultConfirmed &&
    !busy &&
    activeSpaces.length > 0;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canGenerate) {
      return;
    }
    try {
      const asset = await generateMutation.mutateAsync({
        spaceId: effectiveSpaceId,
        prompt: prompt.trim(),
        adultConfirmed,
        image: referenceFile ?? undefined,
        description: "Generated with photorealistic CPU model",
      });
      setLastSaved(asset);
      if (savedPreviewUrl) {
        URL.revokeObjectURL(savedPreviewUrl);
      }
      if (asset.contentAvailable) {
        try {
          const blob = await assetService.getContentBlob(asset.id);
          setSavedPreviewUrl(URL.createObjectURL(blob));
        } catch {
          setSavedPreviewUrl(null);
        }
      } else {
        setSavedPreviewUrl(null);
      }
    } catch {
      // Toast is shown by the mutation onError handler.
    }
  };

  return (
    <form
      id="generate-image"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="space-y-4 rounded-xl border p-4"
    >
      <div>
        <h2 className="text-sm font-medium">Generate image</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          NVIDIA GPU uses the Moss photographic LoRA. This PC has no NVIDIA, so
          it uses a photorealistic CPU model instead (slower, more accurate).
          The same prompt always produces the same image. Use a photo as a
          reference, then save the result as an asset.
        </p>
      </div>

      {statusQuery.isError ? (
        <p className="text-muted-foreground text-sm" role="status">
          Status check timed out. The generator may still be busy creating an
          image. You can generate — wait several minutes after clicking.
        </p>
      ) : status && !status.available ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status.message ??
            "Start the image-gen service on port 8090, then generate."}
        </p>
      ) : status?.available && !status.ready ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status.message}
        </p>
      ) : status?.available && status.ready ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status.message}
          {status.model ? ` Model: ${status.model}.` : ""}
        </p>
      ) : null}

      {activeSpaces.length === 0 && !spacesLoading ? (
        <p className="text-muted-foreground text-sm">
          Create a Space before generating images.
        </p>
      ) : (
        <>
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

          {referenceFile ? (
            <div className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img
                  src={previewUrl}
                  alt="Reference photo"
                  className="size-16 rounded-md object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{referenceFile.name}</p>
                <p className="text-muted-foreground text-xs">
                  Used as a reference photo for generation
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                aria-label="Remove reference photo"
                onClick={() => onClearReference?.()}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Crop or queue a photo above, then click Generate on that file to
              use it as a reference.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor={promptId}>Prompt</Label>
            <Textarea
              id={promptId}
              value={prompt}
              disabled={busy}
              rows={5}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          <label
            htmlFor={confirmId}
            className="flex items-start gap-2 text-sm leading-5"
          >
            <input
              id={confirmId}
              type="checkbox"
              className="mt-0.5"
              checked={adultConfirmed}
              disabled={busy}
              onChange={(event) => setAdultConfirmed(event.target.checked)}
            />
            <span>
              I confirm this is for fictional adult subjects only. No minors,
              no real-person deepfakes.
            </span>
          </label>

          {busy ? (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Loader size="sm" label="Generating image" />
                  Generating {percent}%
                </span>
                <span className="text-muted-foreground text-xs">
                  {steps > 0 ? `${step}/${steps} · ${etaLabel}` : etaLabel}
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${percent || 2}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Keep this tab open and the PC awake. CPU photos take about 25–35
                minutes.
              </p>
            </div>
          ) : null}

          {lastSaved && !busy ? (
            <div
              className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5"
              role="status"
            >
              {savedPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img
                  src={savedPreviewUrl}
                  alt="Generated image"
                  className="size-16 rounded-md object-cover"
                />
              ) : (
                <CircleCheckIcon className="mt-0.5 size-5 text-emerald-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <CircleCheckIcon className="size-4 text-emerald-500" />
                  Image generated and saved
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {lastSaved.name} is now in your Space. Open it from the list
                  below.
                </p>
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={!canGenerate}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader size="sm" label="Generating image" />
                Generating {percent}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <SparklesIcon className="size-4" aria-hidden="true" />
                Generate and save
              </span>
            )}
          </Button>
        </>
      )}
    </form>
  );
}

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) {
    return "Estimating time…";
  }
  if (seconds < 45) {
    return "Less than a minute left";
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `About ${minutes} min left`;
}
