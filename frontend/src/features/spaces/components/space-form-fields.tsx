"use client";

import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SPACE_TYPE_OPTIONS } from "@/features/spaces/schemas";
import type { CreateSpaceFormValues } from "@/features/spaces/schemas";
import { cn } from "@/utils";

interface SpaceFormFieldsProps {
  register: UseFormRegister<CreateSpaceFormValues>;
  errors: FieldErrors<CreateSpaceFormValues>;
  setValue: UseFormSetValue<CreateSpaceFormValues>;
  watch: UseFormWatch<CreateSpaceFormValues>;
  showSlug?: boolean;
  disabled?: boolean;
}

export function SpaceFormFields({
  register,
  errors,
  setValue,
  watch,
  showSlug = true,
  disabled = false,
}: SpaceFormFieldsProps) {
  const type = watch("type");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="space-name">Name</Label>
        <Input
          id="space-name"
          placeholder="Health"
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      {showSlug ? (
        <div className="space-y-2">
          <Label htmlFor="space-slug">Slug (optional)</Label>
          <Input
            id="space-slug"
            placeholder="health"
            disabled={disabled}
            aria-invalid={Boolean(errors.slug)}
            {...register("slug")}
          />
          {errors.slug ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.slug.message}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Leave blank to auto-generate from the name.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="space-description">Description</Label>
        <Textarea
          id="space-description"
          placeholder="Medical records and appointments"
          disabled={disabled}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="space-type">Type</Label>
          <select
            id="space-type"
            className={cn(
              "border-input bg-background flex h-9 w-full rounded-lg border px-3 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
            )}
            disabled={disabled}
            value={type}
            onChange={(event) =>
              setValue("type", event.target.value as CreateSpaceFormValues["type"], {
                shouldDirty: true,
              })
            }
          >
            {SPACE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="space-color">Color (optional)</Label>
          <Input
            id="space-color"
            placeholder="#4CAF50"
            disabled={disabled}
            aria-invalid={Boolean(errors.color)}
            {...register("color")}
          />
          {errors.color ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.color.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="space-icon">Icon (optional)</Label>
        <Input
          id="space-icon"
          placeholder="heart"
          disabled={disabled}
          aria-invalid={Boolean(errors.icon)}
          {...register("icon")}
        />
        {errors.icon ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.icon.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Icon key or emoji placeholder for future icon picker.
          </p>
        )}
      </div>

      <div className="bg-muted/40 rounded-lg border px-3 py-2 text-xs">
        <span className="font-medium">Visibility:</span> Private — Spaces are
        owner-only until Sharing is enabled.
      </div>
    </div>
  );
}
