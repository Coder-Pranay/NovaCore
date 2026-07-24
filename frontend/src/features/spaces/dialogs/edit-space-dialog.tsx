"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { SpaceFormFields } from "@/features/spaces/components/space-form-fields";
import { useUpdateSpace } from "@/features/spaces/hooks";
import {
  updateSpaceSchema,
  type UpdateSpaceFormValues,
} from "@/features/spaces/schemas";
import type { Space } from "@/features/spaces/types";

interface EditSpaceDialogProps {
  space: Space | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSpaceDialog({
  space,
  open,
  onOpenChange,
}: EditSpaceDialogProps) {
  const updateSpace = useUpdateSpace();

  const form = useForm<UpdateSpaceFormValues>({
    resolver: zodResolver(updateSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      color: "",
      type: "BLANK",
    },
  });

  useEffect(() => {
    if (space && open) {
      form.reset({
        name: space.name,
        description: space.description ?? "",
        icon: space.icon ?? "",
        color: space.color ?? "",
        type: space.type,
      });
    }
  }, [space, open, form]);

  const isLoading = form.formState.isSubmitting || updateSpace.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit space</DialogTitle>
          <DialogDescription>Update space details and appearance.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(async (values) => {
            if (!space) {
              return;
            }

            await updateSpace.mutateAsync({
              id: space.id,
              payload: {
                name: values.name,
                description: values.description || null,
                icon: values.icon || null,
                color: values.color || null,
                type: values.type,
                favorite: space.favorite,
                displayOrder: space.displayOrder,
              },
            });
            onOpenChange(false);
          })}
          noValidate
        >
          <SpaceFormFields
            register={form.register as never}
            errors={form.formState.errors as never}
            setValue={form.setValue as never}
            watch={form.watch as never}
            showSlug={false}
            disabled={isLoading}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !space}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" label="Saving space" />
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
