import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

interface PageSkeletonProps {
  label?: string;
  className?: string;
}

/** Stable layout skeleton to reduce CLS while routes resolve. */
export function PageSkeleton({
  label = "Loading page",
  className,
}: PageSkeletonProps) {
  return (
    <div
      id="main-content"
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6", className)}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
