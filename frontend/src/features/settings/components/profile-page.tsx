"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/features/dashboard/utils";
import {
  useProfile,
  useUpdateProfile,
} from "@/features/settings/hooks";
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/features/settings/schemas";
import { usePreferences } from "@/features/settings/hooks";
import { formatDateTime, getErrorMessage } from "@/utils";

export function ProfilePage() {
  const profileQuery = useProfile();
  const preferencesQuery = usePreferences();
  const updateProfile = useUpdateProfile();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        firstName: profileQuery.data.firstName ?? "",
        lastName: profileQuery.data.lastName ?? "",
        phoneNumber: profileQuery.data.phoneNumber ?? "",
      });
    }
  }, [profileQuery.data, form]);

  if (profileQuery.isError) {
    return (
      <ErrorState
        title="Unable to load profile"
        message={getErrorMessage(profileQuery.error)}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => void profileQuery.refetch()}
          >
            Retry
          </Button>
        }
      />
    );
  }

  const profile = profileQuery.data;
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.username ||
    "Account";
  const prefs = preferencesQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Personal information and organization details.
        </p>
      </div>

      {profileQuery.isLoading || !profile ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <section className="bg-card flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="size-20">
                {profile.profileImageUrl ? (
                  <AvatarImage src={profile.profileImageUrl} alt="" />
                ) : null}
                <AvatarFallback className="text-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-lg font-semibold">{displayName}</h2>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">@{profile.username}</Badge>
                <Badge variant="outline">{profile.status}</Badge>
                {profile.emailVerified ? (
                  <Badge variant="secondary">Email verified</Badge>
                ) : (
                  <Badge variant="destructive">Email unverified</Badge>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card space-y-4 rounded-xl border p-5">
            <div>
              <h2 className="text-base font-semibold">Personal information</h2>
              <p className="text-muted-foreground text-sm">
                Updates use <code>PUT /v1/users/me</code>.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                await updateProfile.mutateAsync({
                  firstName: values.firstName,
                  lastName: values.lastName,
                  phoneNumber: values.phoneNumber || null,
                });
              })}
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    disabled={updateProfile.isPending}
                    aria-invalid={Boolean(form.formState.errors.firstName)}
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {form.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    disabled={updateProfile.isPending}
                    aria-invalid={Boolean(form.formState.errors.lastName)}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {form.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile.username} disabled readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone number</Label>
                <Input
                  id="phoneNumber"
                  disabled={updateProfile.isPending}
                  aria-invalid={Boolean(form.formState.errors.phoneNumber)}
                  {...form.register("phoneNumber")}
                />
                {form.formState.errors.phoneNumber ? (
                  <p className="text-destructive text-sm" role="alert">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                ) : null}
              </div>

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </section>

          <section className="bg-card grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-base font-semibold">Organization</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {prefs?.organizationName?.trim()
                  ? prefs.organizationName
                  : "Not set — edit in Settings → Preferences"}
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold">Locale</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Language: {prefs?.language ?? "en"}
                <br />
                Timezone: {prefs?.timezone ?? "UTC"}
                <br />
                Theme: {prefs?.theme ?? "system"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <h2 className="text-base font-semibold">Account metadata</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Created {formatDateTime(profile.createdAt)} · Updated{" "}
                {formatDateTime(profile.updatedAt)}
                <br />
                Roles: {profile.roles.join(", ") || "—"}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
