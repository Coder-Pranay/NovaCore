"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

interface AnalyticsStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsStatCard({
  title,
  value,
  subtitle,
  isLoading,
  className,
}: AnalyticsStatCardProps) {
  if (isLoading) {
    return <Skeleton className={cn("h-28 w-full rounded-xl", className)} />;
  }

  return (
    <div className={cn("bg-card rounded-xl border p-4", className)}>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {subtitle ? (
        <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
      ) : null}
    </div>
  );
}
