"use client";

import { useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks";
import type {
  NotificationCategory,
  NotificationPreferences,
} from "@/features/notifications/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
} from "@/features/notifications/types";
import { categoryLabel } from "@/features/notifications/utils";

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesDialog({
  open,
  onOpenChange,
}: NotificationPreferencesDialogProps) {
  const preferencesQuery = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const form = useForm<NotificationPreferences>({
    defaultValues: DEFAULT_NOTIFICATION_PREFERENCES,
  });

  useEffect(() => {
    if (preferencesQuery.data && open) {
      form.reset(preferencesQuery.data);
    }
  }, [preferencesQuery.data, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification preferences</DialogTitle>
          <DialogDescription>
            Preferences are stored locally until a Notifications API is available.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await updatePreferences.mutateAsync(values);
            onOpenChange(false);
          })}
        >
          <div className="space-y-3">
            <ToggleRow
              id="pref-inapp"
              label="In-app notifications"
              checked={form.watch("inAppEnabled")}
              onChange={(checked) => form.setValue("inAppEnabled", checked)}
            />
            <ToggleRow
              id="pref-email"
              label="Email notifications"
              checked={form.watch("emailEnabled")}
              onChange={(checked) => form.setValue("emailEnabled", checked)}
            />
            <ToggleRow
              id="pref-push"
              label="Push notifications (placeholder)"
              checked={form.watch("pushEnabled")}
              onChange={(checked) => form.setValue("pushEnabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Categories</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {NOTIFICATION_CATEGORIES.map((category) => (
                <ToggleRow
                  key={category}
                  id={`pref-${category}`}
                  label={categoryLabel(category)}
                  checked={form.watch(`categories.${category}`)}
                  onChange={(checked) =>
                    form.setValue(
                      `categories.${category}` as `categories.${NotificationCategory}`,
                      checked,
                    )
                  }
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updatePreferences.isPending}>
              {updatePreferences.isPending ? "Saving..." : "Save preferences"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
    >
      <Label htmlFor={id} className="cursor-pointer font-normal">
        {label}
      </Label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4"
      />
    </label>
  );
}
