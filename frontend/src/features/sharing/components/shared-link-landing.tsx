"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { LockIcon, LinkIcon, ShieldAlertIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { sharingService } from "@/features/sharing/api/sharing-service";
import {
  sharePasswordSchema,
  type SharePasswordFormValues,
} from "@/features/sharing/schemas";
import type { PublicLinkAccess } from "@/features/sharing/types";
import { getErrorMessage } from "@/utils";
import { formatDate } from "@/utils";

interface SharedLinkLandingProps {
  token: string;
}

export function SharedLinkLanding({ token }: SharedLinkLandingProps) {
  const [access, setAccess] = useState<PublicLinkAccess | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["sharing", "public-link-preview", token],
    queryFn: () => sharingService.previewPublicLink(token),
    retry: false,
    staleTime: 30_000,
  });

  const form = useForm<SharePasswordFormValues>({
    resolver: zodResolver(sharePasswordSchema),
    defaultValues: { password: "" },
  });

  async function unlock(values: SharePasswordFormValues) {
    setAccessError(null);
    setSubmitting(true);
    try {
      const result = await sharingService.accessPublicLink(token, values.password);
      setAccess(result);
      form.reset({ password: "" });
    } catch (error) {
      setAccessError(getErrorMessage(error, "Invalid password"));
    } finally {
      setSubmitting(false);
    }
  }

  async function openUnprotected() {
    setAccessError(null);
    setSubmitting(true);
    try {
      const result = await sharingService.accessPublicLink(token);
      setAccess(result);
    } catch (error) {
      setAccessError(getErrorMessage(error, "Unable to open this share"));
    } finally {
      setSubmitting(false);
    }
  }

  if (previewQuery.isLoading) {
    return (
      <main
        id="main-content"
        className="flex min-h-full flex-1 items-center justify-center p-6"
      >
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (previewQuery.isError) {
    return (
      <main
        id="main-content"
        className="flex min-h-full flex-1 items-center justify-center p-6"
      >
        <EmptyState
          icon={ShieldAlertIcon}
          title="Share not found"
          description={getErrorMessage(
            previewQuery.error,
            "This link is invalid, disabled, or has expired.",
          )}
          action={
            <Link href={ROUTES.HOME}>
              <Button type="button" variant="outline">
                Home
              </Button>
            </Link>
          }
        />
      </main>
    );
  }

  const preview = previewQuery.data!;

  if (access) {
    return (
      <main
        id="main-content"
        className="flex min-h-full flex-1 items-center justify-center p-6"
      >
        <section className="w-full max-w-md space-y-4 rounded-xl border p-6">
          <div className="flex items-start gap-3">
            <LinkIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {access.resourceName}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {access.description ??
                  `Shared ${access.resourceType.toLowerCase()}`}
              </p>
            </div>
          </div>
          <dl className="text-muted-foreground grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Type</dt>
              <dd className="text-foreground font-medium">{access.resourceType}</dd>
            </div>
          </dl>
          <Link href={ROUTES.LOGIN}>
            <Button type="button" className="w-full">
              Sign in to NovaCore
            </Button>
          </Link>
        </section>
      </main>
    );
  }

  if (preview.passwordRequired) {
    return (
      <main
        id="main-content"
        className="flex min-h-full flex-1 items-center justify-center p-6"
      >
        <section className="w-full max-w-md space-y-4 rounded-xl border p-6">
          <div className="flex items-start gap-3">
            <LockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Password required
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Enter the password to open{" "}
                <span className="text-foreground font-medium">
                  {preview.resourceName}
                </span>
                .
                {preview.expiresAt
                  ? ` Link expires ${formatDate(preview.expiresAt, "MMM d, yyyy")}.`
                  : ""}
              </p>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => void unlock(values))}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="share-password">Share password</Label>
              <Input
                id="share-password"
                type="password"
                autoComplete="current-password"
                disabled={submitting}
                aria-invalid={Boolean(form.formState.errors.password || accessError)}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-destructive text-sm" role="alert">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
              {accessError ? (
                <p className="text-destructive text-sm" role="alert">
                  {accessError}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" label="Unlocking share" />
                  Unlocking...
                </span>
              ) : (
                "Unlock"
              )}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="flex min-h-full flex-1 items-center justify-center p-6"
    >
      <section className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <div className="flex items-start gap-3">
          <LinkIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {preview.resourceName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              This public link is ready to open.
              {preview.expiresAt
                ? ` Expires ${formatDate(preview.expiresAt, "MMM d, yyyy")}.`
                : ""}
            </p>
          </div>
        </div>
        {accessError ? (
          <p className="text-destructive text-sm" role="alert">
            {accessError}
          </p>
        ) : null}
        <Button
          type="button"
          className="w-full"
          disabled={submitting}
          onClick={() => void openUnprotected()}
        >
          {submitting ? "Opening..." : "Open shared content"}
        </Button>
      </section>
    </main>
  );
}
