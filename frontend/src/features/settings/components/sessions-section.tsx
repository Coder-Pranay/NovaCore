"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthSessionDevice } from "@/features/auth/types";
import { settingsService } from "@/features/settings/api/settings-service";
import { getErrorMessage } from "@/utils";

const SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;

function formatActive(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SessionsSection() {
  const queryClient = useQueryClient();
  const sessionsQuery = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => settingsService.getSessions(),
  });

  const revokeOther = async () => {
    try {
      await settingsService.logoutOtherSessions();
      toast.success("Other sessions signed out");
      await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to revoke sessions"));
    }
  };

  const revokeOne = async (session: AuthSessionDevice) => {
    try {
      await settingsService.revokeSession(session.id);
      toast.success("Session signed out");
      await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to revoke session"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={sessionsQuery.isFetching}
          onClick={() => void sessionsQuery.refetch()}
        >
          Refresh sessions
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void revokeOther()}
        >
          Logout other sessions
        </Button>
      </div>

      {sessionsQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : sessionsQuery.isError ? (
        <EmptyState
          title="Unable to load sessions"
          description={getErrorMessage(
            sessionsQuery.error,
            "Try refreshing or signing in again.",
          )}
          className="py-8"
        />
      ) : !sessionsQuery.data?.length ? (
        <EmptyState
          title="No active sessions"
          description="Sign in on a device to see it listed here."
          className="py-8"
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {sessionsQuery.data.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {session.device} · {session.browser}
                  {session.current ? (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="text-muted-foreground text-sm">
                  IP {session.ipAddress} · Last active{" "}
                  {formatActive(session.lastActiveAt)}
                </p>
              </div>
              {!session.current ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void revokeOne(session)}
                >
                  Sign out
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
