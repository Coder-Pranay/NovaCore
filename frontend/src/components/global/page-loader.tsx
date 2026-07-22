import { Loader } from "@/components/ui/loader";
import { cn } from "@/utils";

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export function PageLoader({
  label = "Loading page",
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("flex flex-1 items-center justify-center py-16", className)}
    >
      <Loader label={label} />
    </div>
  );
}
