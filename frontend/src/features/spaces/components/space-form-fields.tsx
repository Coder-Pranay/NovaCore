"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { LockIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SPACE_COLOR_OPTIONS,
  SPACE_ICON_OPTIONS,
  normalizeHexColor,
} from "@/features/spaces/constants/appearance";
import type { CreateSpaceFormValues } from "@/features/spaces/schemas";
import { cn } from "@/utils";

interface SpaceFormFieldsProps {
  register: UseFormRegister<CreateSpaceFormValues>;
  errors: FieldErrors<CreateSpaceFormValues>;
  setValue: UseFormSetValue<CreateSpaceFormValues>;
  watch: UseFormWatch<CreateSpaceFormValues>;
  disabled?: boolean;
}

export function SpaceFormFields({
  register,
  errors,
  setValue,
  watch,
  disabled = false,
}: SpaceFormFieldsProps) {
  const selectedColor = normalizeHexColor(watch("color"));
  const selectedIcon = watch("icon") ?? "";

  const colorOptions = (() => {
    if (
      !selectedColor ||
      SPACE_COLOR_OPTIONS.some(
        (option) => normalizeHexColor(option.value) === selectedColor,
      )
    ) {
      return [...SPACE_COLOR_OPTIONS];
    }
    return [
      ...SPACE_COLOR_OPTIONS,
      { value: selectedColor, label: "Current" } as const,
    ];
  })();

  const selectColor = (hex: string) => {
    const next = normalizeHexColor(hex) === selectedColor ? "" : hex;
    setValue("color", next, { shouldDirty: true, shouldValidate: true });
  };

  const selectIcon = (value: string) => {
    const next = selectedIcon === value ? "" : value;
    setValue("icon", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="space-name">Name</Label>
        <Input
          id="space-name"
          placeholder="e.g. Personal, Work, Travel"
          disabled={disabled}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="space-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="space-description"
          placeholder="What belongs in this space?"
          disabled={disabled}
          rows={3}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">Color</legend>
        <p id="space-color-hint" className="text-muted-foreground text-xs">
          Pick a color for lists and cards. Click again to clear.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="listbox"
          aria-label="Space color"
          aria-describedby="space-color-hint"
        >
          {colorOptions.map((option) => {
            const isSelected =
              selectedColor === normalizeHexColor(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={option.label}
                title={option.label}
                disabled={disabled}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform outline-none",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: option.value }}
                onClick={() => selectColor(option.value)}
              />
            );
          })}
        </div>
        {errors.color ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.color.message}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">Icon</legend>
        <p id="space-icon-hint" className="text-muted-foreground text-xs">
          Choose an icon. Click again to clear.
        </p>
        <div
          className="grid grid-cols-4 gap-2 sm:grid-cols-6"
          role="listbox"
          aria-label="Space icon"
          aria-describedby="space-icon-hint"
        >
          {SPACE_ICON_OPTIONS.map(({ value, label, Icon }) => {
            const isSelected = selectedIcon === value;
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={label}
                title={label}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition-colors outline-none",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                onClick={() => selectIcon(value)}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
        {errors.icon ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.icon.message}
          </p>
        ) : null}
      </fieldset>

      {/* type stays in RHF defaults / edit reset; not shown in UI */}
      <input type="hidden" {...register("type")} />

      <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
        <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          <span className="text-foreground font-medium">Private</span> — only
          you can see this space until sharing is enabled.
        </p>
      </div>
    </div>
  );
}
