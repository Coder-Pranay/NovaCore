import type { LucideIcon } from "lucide-react";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  isLoading = false,
  isError = false,
  onRetry,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("py-5", className)}>
        <CardContent className="space-y-3 px-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("py-4", className)}>
        <CardContent className="px-4">
          <ErrorState
            className="py-4"
            title="Unavailable"
            message={`Could not load ${title.toLowerCase()}.`}
            action={
              onRetry ? (
                <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              ) : null
            }
          />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUpIcon
      : trend?.direction === "down"
        ? ArrowDownIcon
        : ArrowRightIcon;

  const content = (
    <Card
      className={cn(
        "py-5 transition-colors",
        href && "hover:bg-muted/40 cursor-pointer",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle ? (
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          ) : null}
          {trend ? (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                trend.direction === "down" && "text-destructive",
                trend.direction === "neutral" && "text-muted-foreground",
              )}
            >
              <TrendIcon className="size-3" aria-hidden="true" />
              {trend.value}%{trend.label ? ` ${trend.label}` : ""}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
