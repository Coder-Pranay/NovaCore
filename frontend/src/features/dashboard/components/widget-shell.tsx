import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

interface WidgetShellProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function WidgetShell({
  title,
  description,
  isLoading = false,
  isError = false,
  isEmpty = false,
  errorMessage = "Unable to load this widget",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  onRetry,
  action,
  className,
  children,
  skeleton,
}: WidgetShellProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          (skeleton ?? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))
        ) : isError ? (
          <ErrorState
            className="py-6"
            title="Failed to load"
            message={errorMessage}
            action={
              onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              ) : null
            }
          />
        ) : isEmpty ? (
          <EmptyState
            className="py-6"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
