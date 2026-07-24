"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/features/dashboard/hooks";
import { getInitials } from "@/features/dashboard/utils";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/utils";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export function WelcomeCardWidget() {
  const { user } = useAuth();
  const dashboard = useDashboard();

  if (dashboard.isLoading) {
    return (
      <Card className="py-6">
        <CardContent className="flex items-center gap-4 px-6">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dashboard.isError) {
    return (
      <Card>
        <CardContent className="px-6 py-4">
          <ErrorState
            title="Welcome unavailable"
            message={getErrorMessage(dashboard.error)}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => dashboard.refetch()}>
                Retry
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const firstName =
    dashboard.data?.user.firstName || user?.firstName || user?.username || "there";
  const imageUrl = dashboard.data?.user.profileImageUrl || user?.profileImageUrl;

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="from-muted/40 via-background to-background flex flex-col gap-4 bg-gradient-to-br px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
            <AvatarFallback className="text-base">{getInitials(firstName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Here is what is happening across your spaces and assets today.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
