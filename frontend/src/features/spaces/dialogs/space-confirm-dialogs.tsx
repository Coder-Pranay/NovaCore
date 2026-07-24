"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Space } from "@/features/spaces/types";

interface SpaceConfirmDialogProps {
  space: Space | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ArchiveSpaceDialog({
  space,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: SpaceConfirmDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Archive space?"
      description={
        space
          ? `"${space.name}" will be hidden from your active spaces list. Soft-delete only — restore API is not available yet.`
          : undefined
      }
      confirmLabel="Archive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}

export function DeleteSpaceDialog({
  space,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: SpaceConfirmDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete space?"
      description={
        space
          ? `"${space.name}" will be archived (soft-deleted). Hard delete is not supported by the current API.`
          : undefined
      }
      confirmLabel="Delete"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}

export function RestoreSpaceDialog({
  space,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: SpaceConfirmDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Restore space?"
      description={
        space
          ? `Restore is not supported by the current Spaces API. "${space.name}" cannot be restored from the client.`
          : "Restore is not supported by the current Spaces API."
      }
      confirmLabel="Try restore"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
