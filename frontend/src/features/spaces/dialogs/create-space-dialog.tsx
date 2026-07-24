"use client";

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
import { useCreateSpace } from "@/features/spaces/hooks";
import {
  createSpaceSchema,
  type CreateSpaceFormValues,
} from "@/features/spaces/schemas";

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (spaceId: string) => void;
}

export function CreateSpaceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSpaceDialogProps) {
  const createSpace = useCreateSpace();

  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      color: "",
      type: "BLANK",
    },
  });

  const isLoading = form.formState.isSubmitting || createSpace.isPending;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create space</DialogTitle>
          <DialogDescription>
            Create a new Life Space to organize your assets.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(async (values) => {
            const space = await createSpace.mutateAsync({
              name: values.name,
              slug: values.slug || undefined,
              description: values.description || null,
              icon: values.icon || null,
              color: values.color || null,
              type: values.type,
            });
            form.reset();
            onOpenChange(false);
            onCreated?.(space.id);
          })}
          noValidate
        >
          <SpaceFormFields
            register={form.register}
            errors={form.formState.errors}
            setValue={form.setValue}
            watch={form.watch}
            disabled={isLoading}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" label="Creating space" />
                  Creating...
                </span>
              ) : (
                "Create space"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
