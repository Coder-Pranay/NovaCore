"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CopyIcon, LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useCopyShareLink,
  useCreatePublicLink,
  useDisablePublicLink,
  usePublicLink,
} from "@/features/sharing/hooks";
import {
  publicLinkSchema,
  type PublicLinkFormValues,
} from "@/features/sharing/schemas";
import type { ShareResource } from "@/features/sharing/types";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getErrorMessage } from "@/utils";

interface ShareDialogProps {
  resource: ShareResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  resource,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const { hasPermission } = useAuth();
  const canWrite =
    hasPermission("sharing:write") ||
    hasPermission("spaces:write") ||
    hasPermission("assets:write");

  const publicLinkQuery = usePublicLink(open ? resource : null);
  const createLinkMutation = useCreatePublicLink();
  const disableLinkMutation = useDisablePublicLink();
  const copyLinkMutation = useCopyShareLink();

  const linkForm = useForm<PublicLinkFormValues>({
    resolver: zodResolver(publicLinkSchema),
    defaultValues: {
      expiresAt: "",
      passwordProtected: false,
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      linkForm.reset({
        expiresAt: "",
        passwordProtected: false,
        password: "",
      });
    }
  }, [open, linkForm]);

  const busy =
    createLinkMutation.isPending || disableLinkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share {resource?.resourceName ?? "item"}</DialogTitle>
          <DialogDescription>
            Create a password-protected public link. Anyone with the link (and
            password, if set) can open a preview of this item.
          </DialogDescription>
        </DialogHeader>

        {!resource ? null : (
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Public link</h3>
            {publicLinkQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : publicLinkQuery.data?.enabled ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <LinkIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {publicLinkQuery.data.url}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {publicLinkQuery.data.expiresAt
                        ? `Expires ${formatDate(publicLinkQuery.data.expiresAt, "MMM d, yyyy")}`
                        : "No expiration"}
                      {publicLinkQuery.data.passwordProtected
                        ? " · Password protected"
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={copyLinkMutation.isPending}
                    onClick={() =>
                      void copyLinkMutation.mutateAsync(publicLinkQuery.data!.url)
                    }
                  >
                    <CopyIcon className="size-3.5" />
                    Copy link
                  </Button>
                  {canWrite ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() =>
                        void disableLinkMutation.mutateAsync({
                          linkId: publicLinkQuery.data!.id,
                          resource,
                        })
                      }
                    >
                      Disable link
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : canWrite ? (
              <form
                className="space-y-3 rounded-lg border p-3"
                onSubmit={linkForm.handleSubmit(async (values) => {
                  await createLinkMutation.mutateAsync({
                    resource,
                    payload: {
                      expiresAt: values.expiresAt || null,
                      passwordProtected: values.passwordProtected,
                      password: values.passwordProtected
                        ? values.password
                        : undefined,
                    },
                  });
                  linkForm.reset({
                    expiresAt: "",
                    passwordProtected: false,
                    password: "",
                  });
                })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="link-expires">Expiration</Label>
                    <Input
                      id="link-expires"
                      type="date"
                      disabled={busy}
                      {...linkForm.register("expiresAt")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-password">Share password</Label>
                    <Input
                      id="link-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        linkForm.watch("passwordProtected")
                          ? "Min. 8 characters"
                          : "Optional"
                      }
                      disabled={busy || !linkForm.watch("passwordProtected")}
                      aria-invalid={Boolean(
                        linkForm.formState.errors.password,
                      )}
                      {...linkForm.register("password")}
                    />
                    {linkForm.formState.errors.password ? (
                      <p className="text-destructive text-sm" role="alert">
                        {linkForm.formState.errors.password.message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={linkForm.watch("passwordProtected")}
                    onChange={(event) => {
                      linkForm.setValue(
                        "passwordProtected",
                        event.target.checked,
                        { shouldValidate: true },
                      );
                      if (!event.target.checked) {
                        linkForm.setValue("password", "", {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  Require password to open link
                </label>
                {createLinkMutation.isError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {getErrorMessage(
                      createLinkMutation.error,
                      "Unable to create public link",
                    )}
                  </p>
                ) : null}
                <Button type="submit" size="sm" disabled={busy}>
                  {createLinkMutation.isPending ? "Generating..." : "Generate link"}
                </Button>
              </form>
            ) : (
              <EmptyState
                title="No public links"
                description="You do not have permission to create public links."
                className="py-6"
              />
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
