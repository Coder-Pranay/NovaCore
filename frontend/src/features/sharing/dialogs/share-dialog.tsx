"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CopyIcon, LinkIcon, Trash2Icon } from "lucide-react";

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
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useCopyShareLink,
  useCreatePublicLink,
  useDisablePublicLink,
  usePublicLink,
  useRemoveAccess,
  useShare,
  useSharedUsers,
  useUpdateSharePermission,
} from "@/features/sharing/hooks";
import { PermissionBadge } from "@/features/sharing/permissions";
import {
  publicLinkSchema,
  shareInviteSchema,
  type PublicLinkFormValues,
  type ShareInviteFormValues,
} from "@/features/sharing/schemas";
import type { SharePermission, ShareResource } from "@/features/sharing/types";
import { SHARE_PERMISSIONS } from "@/features/sharing/types";
import { permissionLabel } from "@/features/sharing/utils";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, cn } from "@/utils";

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
  const { user, hasPermission } = useAuth();
  const canWrite =
    hasPermission("sharing:write") ||
    hasPermission("spaces:write") ||
    hasPermission("assets:write");

  const usersQuery = useSharedUsers(open ? resource : null);
  const publicLinkQuery = usePublicLink(open ? resource : null);
  const shareMutation = useShare();
  const updatePermissionMutation = useUpdateSharePermission();
  const removeAccessMutation = useRemoveAccess();
  const createLinkMutation = useCreatePublicLink();
  const disableLinkMutation = useDisablePublicLink();
  const copyLinkMutation = useCopyShareLink();

  const inviteForm = useForm<ShareInviteFormValues>({
    resolver: zodResolver(shareInviteSchema),
    defaultValues: {
      email: "",
      permission: "VIEWER",
      expiresAt: "",
    },
  });

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
      inviteForm.reset({
        email: "",
        permission: "VIEWER",
        expiresAt: "",
      });
      linkForm.reset({
        expiresAt: "",
        passwordProtected: false,
        password: "",
      });
    }
  }, [open, inviteForm, linkForm]);

  const busy =
    shareMutation.isPending ||
    updatePermissionMutation.isPending ||
    removeAccessMutation.isPending ||
    createLinkMutation.isPending ||
    disableLinkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share {resource?.resourceName ?? "item"}</DialogTitle>
          <DialogDescription>
            Invite people, manage permissions, and create public links.
            Sharing is stored locally until the Sharing API ships.
          </DialogDescription>
        </DialogHeader>

        {!resource ? null : (
          <div className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={inviteForm.handleSubmit(async (values) => {
                if (!canWrite || !user) return;
                await shareMutation.mutateAsync({
                  resource,
                  invitedBy: user.email ?? user.username,
                  payload: {
                    email: values.email,
                    permission: values.permission,
                    expiresAt: values.expiresAt || null,
                  },
                });
                inviteForm.reset({
                  email: "",
                  permission: "VIEWER",
                  expiresAt: "",
                });
              })}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="share-email">Invite email</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="teammate@example.com"
                  disabled={!canWrite || busy}
                  aria-invalid={Boolean(inviteForm.formState.errors.email)}
                  {...inviteForm.register("email")}
                />
                {inviteForm.formState.errors.email ? (
                  <p className="text-destructive text-sm" role="alert">
                    {inviteForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="share-permission">Permission</Label>
                  <select
                    id="share-permission"
                    className={selectClassName}
                    disabled={!canWrite || busy}
                    value={inviteForm.watch("permission")}
                    onChange={(event) =>
                      inviteForm.setValue(
                        "permission",
                        event.target.value as SharePermission,
                        { shouldDirty: true },
                      )
                    }
                  >
                    {SHARE_PERMISSIONS.map((permission) => (
                      <option key={permission} value={permission}>
                        {permissionLabel(permission)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="share-expires">Expiration</Label>
                  <Input
                    id="share-expires"
                    type="date"
                    disabled={!canWrite || busy}
                    {...inviteForm.register("expiresAt")}
                  />
                </div>
              </div>

              {canWrite ? (
                <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                  {shareMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader size="sm" label="Sending invite" />
                      Inviting...
                    </span>
                  ) : (
                    "Invite"
                  )}
                </Button>
              ) : null}
            </form>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">People with access</h3>
              {usersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : !usersQuery.data?.length ? (
                <EmptyState
                  title="No shared users"
                  description="Invite someone by email to collaborate."
                  className="py-6"
                />
              ) : (
                <ul className="divide-border divide-y rounded-lg border">
                  {usersQuery.data.map((share) => (
                    <li
                      key={share.id}
                      className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{share.email}</p>
                        <p className="text-muted-foreground text-xs">
                          {share.status}
                          {share.expiresAt
                            ? ` · expires ${formatDate(share.expiresAt, "MMM d, yyyy")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canWrite ? (
                          <select
                            aria-label={`Permission for ${share.email}`}
                            className={cn(selectClassName, "h-8 w-auto")}
                            disabled={busy}
                            value={share.permission}
                            onChange={(event) =>
                              void updatePermissionMutation.mutateAsync({
                                shareId: share.id,
                                resource,
                                payload: {
                                  permission: event.target
                                    .value as SharePermission,
                                },
                              })
                            }
                          >
                            {SHARE_PERMISSIONS.map((permission) => (
                              <option key={permission} value={permission}>
                                {permissionLabel(permission)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <PermissionBadge permission={share.permission} />
                        )}
                        {canWrite ? (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={busy}
                            aria-label={`Remove access for ${share.email}`}
                            onClick={() =>
                              void removeAccessMutation.mutateAsync({
                                shareId: share.id,
                                resource,
                              })
                            }
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

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
                          ? " · Password protected (placeholder)"
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
                      },
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
                      <Label htmlFor="link-password">Password (placeholder)</Label>
                      <Input
                        id="link-password"
                        type="password"
                        placeholder="Optional"
                        disabled={busy}
                        {...linkForm.register("password")}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={linkForm.watch("passwordProtected")}
                      onChange={(event) =>
                        linkForm.setValue("passwordProtected", event.target.checked)
                      }
                    />
                    Require password (UI only)
                  </label>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const selectClassName = cn(
  "border-input bg-background flex h-9 w-full rounded-lg border px-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
);
